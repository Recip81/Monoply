import type { GameState } from "./GameState.js";
import { Board } from "./Board.js";
import { performRoll } from "./actions/RollDice.js";
import {
  movePlayer,
  teleportTo,
  sendToJail,
  JAIL_VISIT_CELL,
} from "./actions/MovePlayer.js";
import { buyProperty } from "./actions/BuyProperty.js";
import { computeRent } from "./actions/PayRent.js";
import { buildHouse } from "./actions/BuildHouse.js";
import { sellHouse } from "./actions/SellHouse.js";
import { mortgage, redeem } from "./actions/Mortgage.js";
import { computeTax, payTax } from "./actions/Tax.js";
import {
  drawCard,
  repairCost,
  housesBonusAmount,
  findNearestStation,
  findNearestUtility,
  type CardEffect,
} from "./actions/DrawCard.js";
import { spinWheel } from "./actions/fun/LuckyWheel.js";
import { fightArena } from "./actions/fun/Arena.js";
import { koiReward, applyKoi } from "./actions/fun/KoiPond.js";
import { WISH_COST, makeWish } from "./actions/fun/WishFountain.js";
import { demolitionTargets, demolish } from "./actions/fun/Demolition.js";
import {
  blackMarketBuyOptions,
  blackMarketSellOptions,
  blackMarketBuy,
  blackMarketSell,
} from "./actions/fun/BlackMarket.js";
import { runLottery } from "./actions/fun/Lottery.js";
import { validateTrade, executeTrade } from "./actions/Trade.js";
import { bankruptPlayer, liquidationValue } from "./actions/Bankrupt.js";
import { computeScores, topScorerId } from "./actions/Score.js";
import { rollOne } from "./Dice.js";
import type { ActionMessage, TradeOffer } from "@shared/types";

// 向房间内所有客户端广播事件
export type Emit = (event: string, payload: any) => void;

const STATION_TELEPORT: Record<number, { to: number; passStart: boolean }> = {
  7: { to: 39, passStart: false },
  39: { to: 7, passStart: true },
  23: { to: 55, passStart: false },
  55: { to: 23, passStart: true },
};

// 满 60 回合进入计分模式
export const MAX_ROUNDS = 60;

// 动画节奏（毫秒）
const DICE_SHOW_MS = 1400; // 掷骰结果展示时长
const STEP_MS = 320; // 每格移动时长
const EVENT_GAP_MS = 200; // 移动结束到事件弹出的间隔
// 第三幕事件结果展示时长：给客户端动画留出播放时间，再关闭舞台
const EVENT_SHOW_MS = 1800; // 普通事件（税务/缴租/卡牌收尾）展示时长
const WHEEL_ANIM_MS = 2500; // 转盘 CSS 转动时长
const DICE_ANIM_MS = 1000; // 骰子滚动动画时长
const RESULT_VIEW_MS = 1800; // 结果揭晓后观看时长
const KOI_SHOW_MS = DICE_ANIM_MS + RESULT_VIEW_MS; // 锦鲤池总展示≈2.8s
const LOTTERY_SHOW_MS = DICE_ANIM_MS + RESULT_VIEW_MS; // 彩票总展示≈2.8s
const ARENA_SHOW_MS = DICE_ANIM_MS + RESULT_VIEW_MS; // 擂台总展示≈2.8s
const CARD_SHOW_MS = 2200; // 命运/公共基金卡面展示
const RENT_SHOW_MS = 1600; // 缴租/税务结果停留（金币飘字 1.4s）

export class TurnManager {
  state: GameState;
  emit: Emit;
  private lastDiceTotal = 0;
  private awaitingBuy = false;
  private rollingLocked = false; // 防止掷骰延时期间重复触发
  private builtThisTurn = false; // 本回合是否已建过房（每回合限一次）
  private boughtThisTurnCells = new Set<number>(); // 本回合刚购入的格子（当回合不可建房）
  private arenaTargetId: string | null = null; // 擂台选中的对手（决战前暂存）
  // 擂台回合制摇骰状态
  private arenaFight: {
    challengerId: string; opponentId: string; challengerRoll?: number; opponentRoll?: number;
  } | null = null;

  // 破产自救：现金为负的玩家进入自救（卖房/抵押），补足前暂停流程
  private rescueDebtorId: string | null = null; // 正在自救的玩家
  private rescueResume: (() => void) | null = null; // 自救成功后继续的回调

  // 缓存最后一次舞台/输入事件，供重连时定向重发（避免刷新丢失舞台）
  private lastStageStart: any = null;
  private lastNeedInput: any = null;

  constructor(state: GameState, rawEmit: Emit) {
    this.state = state;
    // 包装 emit：嗅探 stage_start / need_input 以便重连重放；stage_end / free_action 时清理
    this.emit = (event: string, payload: any) => {
      if (event === "stage_start") this.lastStageStart = payload;
      else if (event === "stage_end") this.lastStageStart = null;
      else if (event === "need_input") {
        this.lastNeedInput = payload?.inputType === "free_action" ? null : payload;
      }
      rawEmit(event, payload);
    };
  }

  // 重连时把当前舞台/输入状态定向重发给单个 socket（不广播，避免打扰其他玩家）
  replayStageTo(send: (event: string, payload: any) => void) {
    if (this.lastStageStart) send("stage_start", this.lastStageStart);
    if (this.lastNeedInput) send("need_input", this.lastNeedInput);
  }

  private sync() {
    this.emit("state_sync", { state: this.state.toFullState() });
  }

  // 延时续接：给客户端留出动画时间（掷骰展示、棋子滑行等）。
  private wait(ms: number, fn: () => void) {
    setTimeout(fn, ms);
  }

  // 游戏结束：计算各玩家得分并广播。胜者优先取唯一存活者，否则取最高分。
  private gameOver() {
    this.state.phase = "game_over";
    // 清除任何待处理输入（如自救面板），避免遗留弹窗盖住结算页
    this.rescueDebtorId = null;
    this.rescueResume = null;
    this.lastNeedInput = null;
    this.lastStageStart = null;
    const scores = computeScores(this.state);
    const survivor = this.state.winner();
    const winnerId = survivor ? survivor.id : topScorerId(this.state);
    this.emit("game_over", { winnerId, scores });
    this.sync();
  }

  // 开始一个新回合
  beginTurn() {
    const player = this.state.currentPlayer;
    this.awaitingBuy = false;
    this.builtThisTurn = false;
    this.boughtThisTurnCells.clear();

    if (this.state.isGameOver()) {
      this.gameOver();
      return;
    }

    // 满 60 回合 → 进入计分模式结束
    if (this.state.turnNumber > MAX_ROUNDS) {
      this.gameOver();
      return;
    }

    // 破产玩家自动跳过
    if (player.bankrupt) {
      this.state.nextTurn();
      this.beginTurn();
      return;
    }

    this.emit("turn_begin", {
      playerId: player.id,
      turnNumber: this.state.turnNumber,
    });

    if (player.inJail) {
      this.state.phase = "jail_choice";
      // 打开舞台，让 DiceStage 渲染入狱选项
      this.emit("stage_start", { stage: 1, content: { playerId: player.id, inJail: true } });
      this.emit("need_input", {
        inputType: "jail_choice",
        options: { canPay: player.cash >= 75, hasCard: player.getOutOfJailCards > 0 },
      });
      this.sync();
      return;
    }

    this.state.phase = "rolling";
    this.emit("stage_start", { stage: 1, content: { playerId: player.id, luckWish: player.wish?.type === "luck" } });
    this.sync();
  }

  // 处理客户端 action
  handleAction(playerId: string, action: ActionMessage) {
    const current = this.state.currentPlayer;

    switch (action.type) {
      case "roll_dice":
        if (playerId !== current.id) return;
        if (this.state.phase !== "rolling") return;
        if (this.rollingLocked) return;
        this.rollingLocked = true;
        this.doRoll(action.payload?.diceCount);
        break;
      case "buy_property":
        if (playerId !== current.id || !this.awaitingBuy) return;
        this.doBuy(true);
        break;
      case "skip_buy":
        if (playerId !== current.id || !this.awaitingBuy) return;
        this.doBuy(false);
        break;
      case "end_turn":
        if (playerId !== current.id) return;
        if (this.state.phase !== "free_action") return;
        this.endTurn();
        break;
      case "jail_pay":
        if (playerId !== current.id || this.state.phase !== "jail_choice") return;
        this.doJailPay();
        break;
      case "jail_roll":
        if (playerId !== current.id || this.state.phase !== "jail_choice") return;
        this.doJailRoll();
        break;
      case "jail_card":
        if (playerId !== current.id || this.state.phase !== "jail_choice") return;
        this.doJailCard();
        break;
      // ── 自由操作阶段：建房/卖房/抵押/赎回（仅当前玩家、free_action） ──
      case "build_house":
        if (playerId !== current.id || this.state.phase !== "free_action") return;
        this.doBuild(action.payload?.cellId);
        break;
      case "sell_house":
        // 自救模式下，欠款玩家可卖房；否则仅当前玩家在 free_action
        if (this.rescueDebtorId) {
          if (playerId !== this.rescueDebtorId) return;
          this.doSell(action.payload?.cellId, playerId);
        } else {
          if (playerId !== current.id || this.state.phase !== "free_action") return;
          this.doSell(action.payload?.cellId);
        }
        break;
      case "mortgage":
        if (this.rescueDebtorId) {
          if (playerId !== this.rescueDebtorId) return;
          this.doMortgage(action.payload?.cellId, playerId);
        } else {
          if (playerId !== current.id || this.state.phase !== "free_action") return;
          this.doMortgage(action.payload?.cellId);
        }
        break;
      case "redeem":
        if (playerId !== current.id || this.state.phase !== "free_action") return;
        this.doRedeem(action.payload?.cellId);
        break;
      case "declare_bankrupt":
        // 自救放弃 → 真正破产（仅当前正在自救的欠款玩家可声明）
        if (this.rescueDebtorId !== playerId) return;
        this.doDeclareBankrupt(playerId);
        break;
      case "arena_roll":
        // 擂台回合制摇骰（仅擂台双方可摇）
        if (!this.arenaFight) return;
        if (playerId !== this.arenaFight.challengerId && playerId !== this.arenaFight.opponentId) return;
        this.doArenaRoll(playerId);
        break;
      case "fun_start":
        // 趣味格启动按钮（转盘/锦鲤/彩票），仅当前玩家在 input_required 时可点
        if (playerId !== current.id || this.state.phase !== "input_required") return;
        this.doFunStart(action.payload?.funType);
        break;
      // ── 趣味格输入（仅当前玩家、input_required） ──
      case "select_opponent":
        if (playerId !== current.id || this.state.phase !== "input_required") return;
        // 暂存对手，等玩家点击"决战"按钮后才真正对决
        this.arenaTargetId = action.payload?.targetId ?? null;
        if (!this.arenaTargetId) return;
        this.state.phase = "input_required";
        this.emit("need_input", {
          inputType: "fun_trigger",
          options: { funType: "arena", label: "决战", opponentId: this.arenaTargetId },
        });
        this.sync();
        break;
      case "wish_choose":
        if (playerId !== current.id || this.state.phase !== "input_required") return;
        this.doWish(action.payload?.option);
        break;
      case "blackmarket_choose":
        if (playerId !== current.id || this.state.phase !== "input_required") return;
        this.doBlackMarket(action.payload?.option, action.payload?.targetCellId);
        break;
      case "demolish_choose":
        if (playerId !== current.id || this.state.phase !== "input_required") return;
        this.doDemolish(action.payload?.cellId ?? null);
        break;
      // ── 交易（自救期间欠款玩家也可发起） ──
      case "trade_offer":
        if (playerId !== current.id && playerId !== this.rescueDebtorId) return;
        this.doTradeOffer(playerId, action.payload);
        break;
      case "trade_respond":
        this.doTradeRespond(playerId, action.payload?.tradeId, action.payload?.accept);
        break;
      default:
        break;
    }
  }

  // 发送第一幕掷骰舞台，带上当前玩家是否持有幸运之愿（可选 1/2 颗骰子）
  private emitRollStage() {
    const player = this.state.currentPlayer;
    this.emit("stage_start", {
      stage: 1,
      content: { playerId: player.id, luckWish: player.wish?.type === "luck" },
    });
  }

  private doRoll(diceCount?: number) {
    const player = this.state.currentPlayer;

    // 幸运之愿：持有 luck 且选择掷 1 颗骰子 → 单骰（不触发双骰逻辑），消耗愿望
    if (player.wish?.type === "luck" && diceCount === 1) {
      player.wish = null;
      this.state.consecutiveDoubles = 0;
      const n = rollOne();
      this.lastDiceTotal = n;
      this.emit("player_acted", { playerId: player.id, action: "wish_consumed", detail: { type: "luck" } });
      this.emit("dice_result", { dice: [n, 0], isDouble: false, consecutiveDoubles: 0 });
      this.emit("stage_end", { stage: 1 });
      this.state.phase = "moving";
      this.moveAndResolve(n);
      return;
    }

    const result = performRoll(this.state);
    this.lastDiceTotal = result.roll.total;

    this.emit("dice_result", {
      dice: result.roll.dice,
      isDouble: result.roll.isDouble,
      consecutiveDoubles: result.consecutiveDoubles,
    });

    // 连续三次双骰 → 入狱
    if (result.goToJail) {
      sendToJail(this.state, player.id);
      this.emit("player_acted", {
        playerId: player.id,
        action: "go_jail",
        detail: { reason: "连续三次双骰" },
      });
      this.state.phase = "free_action";
      this.sync();
      this.emit("stage_end", { stage: 1 });
      // 入狱后直接结束回合
      this.endTurn();
      return;
    }

    // 掷骰结果停留 1.4s，再收起骰子舞台并开始移动
    this.wait(DICE_SHOW_MS, () => {
      this.rollingLocked = false;
      this.emit("stage_end", { stage: 1 });
      this.state.phase = "moving";
      this.moveAndResolve(result.roll.total);
    });
  }

  private moveAndResolve(steps: number) {
    const player = this.state.currentPlayer;
    const move = movePlayer(this.state, player.id, steps);

    this.emit("move_start", {
      playerId: player.id,
      from: move.from,
      to: move.to,
      path: move.path,
    });
    if (move.passedStart) {
      this.onPassStart();
    }
    this.emit("move_end", { playerId: player.id, cellId: move.to });
    this.sync();

    // 棋子按路径逐格滑行（每格约 300ms），到位后再弹出落地事件
    const travel = Math.max(1, move.path.length) * STEP_MS + EVENT_GAP_MS;
    this.wait(travel, () => this.resolveLanding());
  }

  // 处理落地格事件
  private resolveLanding() {
    const player = this.state.currentPlayer;
    const cellId = player.position;
    const cell = Board.get(cellId);
    this.state.phase = "event";

    // 入狱格
    if (cell.type === "special" && cellId === 48) {
      sendToJail(this.state, player.id);
      this.emit("stage_start", {
        stage: 3,
        content: { cellId, type: "go_jail", name: cell.name, emoji: cell.emoji },
      });
      this.emit("player_acted", { playerId: player.id, action: "go_jail", detail: {} });
      this.sync();
      this.finishEvent();
      return;
    }

    // 车站传送
    if (cell.type === "station") {
      this.handleBuyableLanding(cellId, () => {
        const tp = STATION_TELEPORT[cellId];
        if (tp) {
          const move = teleportTo(this.state, player.id, tp.to, tp.passStart);
          this.emit("teleport", {
            playerId: player.id,
            from: move.from,
            to: move.to,
            passedStart: tp.passStart,
          });
          if (tp.passStart) {
            this.onPassStart();
          }
          this.sync();
          // 传送到对向站后，结算对向站的缴租（对向站若有主）
          this.resolveTeleportRent(tp.to);
        }
      });
      return;
    }

    // 地产 / 公用事业
    if (cell.type === "property" || cell.type === "utility") {
      this.handleBuyableLanding(cellId);
      return;
    }

    // 税务
    if (cell.type === "tax") {
      const tax = computeTax(this.state, player.id, cellId);
      payTax(this.state, player.id, tax.amount);
      this.emit("stage_start", {
        stage: 3,
        content: { cellId, type: "tax", name: cell.name, emoji: cell.emoji, amount: tax.amount },
      });
      this.emit("cash_change", { playerId: player.id, amount: -tax.amount, reason: tax.reason });
      this.emit("player_acted", {
        playerId: player.id,
        action: "pay_tax",
        detail: { amount: tax.amount },
      });
      this.sync();
      // 税务动画延迟展示后再结束（若现金为负则先自救）
      this.checkBankruptThen(() => this.wait(EVENT_SHOW_MS, () => this.finishEvent()));
      return;
    }

    // 命运 / 公共基金卡
    if (cell.type === "fate" || cell.type === "fund") {
      const deckType = cell.type;
      this.emit("stage_start", {
        stage: 3,
        content: { cellId, type: deckType, name: cell.name, emoji: cell.emoji },
      });
      const result = drawCard(this.state, player.id, deckType);
      this.emit("card_drawn", {
        deckType: result.deckType,
        card: result.card,
        playerId: player.id,
      });
      // 先展示卡面，留出阅读时间再落实效果（移动类卡会切换舞台）
      this.wait(CARD_SHOW_MS, () => this.applyCardEffect(result.effect));
      return;
    }

    // 趣味格
    if (cell.type === "fun" && cell.funType) {
      this.emit("stage_start", {
        stage: 3,
        content: { cellId, type: "fun", funType: cell.funType, name: cell.name, emoji: cell.emoji },
      });
      this.resolveFunCell(cell.funType);
      return;
    }

    // 其余格子（免费停车 / 探访 等）无事件
    this.emit("stage_start", {
      stage: 3,
      content: { cellId, type: cell.type, name: cell.name, emoji: cell.emoji },
    });
    this.sync();
    this.finishEvent();
  }

  // ── 趣味格分发 ──
  private funLabel(funType: string): string {
    switch (funType) {
      case "lucky_wheel": return "转动转盘";
      case "koi_pond": return "掷骰博运气";
      case "lottery": return "开奖";
      default: return "开始";
    }
  }

  private resolveFunCell(funType: string) {
    const player = this.state.currentPlayer;
    switch (funType) {
      case "lucky_wheel":
      case "koi_pond":
      case "lottery": {
        // 先展示舞台，等玩家点击"开始"按钮后再结算
        this.state.phase = "input_required";
        this.emit("need_input", {
          inputType: "fun_trigger",
          options: { funType, label: this.funLabel(funType) },
        });
        this.sync();
        break;
      }
      case "arena": {
        // 选择对手：未破产、未在狱、非自己
        const opponents = this.state.players.filter(
          (p) => p.id !== player.id && !p.bankrupt && !p.inJail
        );
        if (opponents.length === 0) {
          this.emit("player_acted", { playerId: player.id, action: "arena_skip", detail: { reason: "无可选对手" } });
          this.finishEvent();
          return;
        }
        this.state.phase = "input_required";
        this.emit("need_input", {
          inputType: "select_opponent",
          options: { opponents: opponents.map((p) => ({ id: p.id, nickname: p.nickname, emoji: p.emoji })) },
        });
        this.sync();
        break;
      }
      case "wish_fountain":
        this.state.phase = "input_required";
        this.emit("need_input", {
          inputType: "wish_choose",
          options: {
            A: { cost: WISH_COST.A, canAfford: player.cash >= WISH_COST.A },
            B: { cost: WISH_COST.B, canAfford: player.cash >= WISH_COST.B },
            C: { cost: WISH_COST.C, canAfford: player.cash >= WISH_COST.C },
          },
        });
        this.sync();
        break;
      case "black_market":
        this.state.phase = "input_required";
        this.emit("need_input", {
          inputType: "blackmarket_choose",
          options: {
            buyList: blackMarketBuyOptions(this.state),
            sellList: blackMarketSellOptions(this.state, player.id),
          },
        });
        this.sync();
        break;
      case "demolition": {
        const targets = demolitionTargets(this.state);
        if (targets.length === 0) {
          this.emit("player_acted", { playerId: player.id, action: "demolish_skip", detail: { reason: "无可拆目标" } });
          this.finishEvent();
          return;
        }
        this.state.phase = "input_required";
        this.emit("need_input", { inputType: "demolish_choose", options: { targets } });
        this.sync();
        break;
      }
      default:
        this.finishEvent();
    }
  }

  // ── 趣味格启动按钮回调 ──
  private doFunStart(funType: string) {
    // 清除等待输入状态，开始结算
    switch (funType) {
      case "lucky_wheel":
        this.doLuckyWheel();
        break;
      case "koi_pond":
        this.doKoiPond();
        break;
      case "lottery":
        this.doLottery();
        break;
      case "arena":
        // 双方同时各自摇骰，不分先后
        this.arenaFight = {
          challengerId: this.state.currentPlayer.id,
          opponentId: this.arenaTargetId ?? "",
        };
        this.arenaTargetId = null;
        this.state.phase = "input_required";
        this.emit("need_input", {
          inputType: "arena_roll",
          options: {
            challengerId: this.arenaFight.challengerId,
            opponentId: this.arenaFight.opponentId,
            challengerName: this.state.currentPlayer.nickname,
            opponentName: this.state.getPlayer(this.arenaFight.opponentId)?.nickname ?? "",
          },
        });
        this.sync();
        break;
        break;
      default:
        this.finishEvent();
    }
  }

  // #8 幸运转盘
  private doLuckyWheel() {
    const player = this.state.currentPlayer;
    const outcome = spinWheel();

    // 先不广播 outcome，让客户端转盘纯动画转动
    if (outcome.cash) {
      player.cash += outcome.cash;
      this.emit("cash_change", { playerId: player.id, amount: outcome.cash, reason: `幸运转盘·${outcome.label}` });
    }
    this.sync();

    if (outcome.move) {
      // 留出转盘动画时间，转完再展示结果并前进/后退（后退不收过起点）
      // 转盘动画播完后再展示结果 → 前进/后退
      this.wait(WHEEL_ANIM_MS, () => {
        this.emit("player_acted", { playerId: player.id, action: "lucky_wheel", detail: outcome });
        this.wait(RESULT_VIEW_MS, () => {
          const move = movePlayer(this.state, player.id, outcome.move!, outcome.move! > 0);
          this.emit("move_start", { playerId: player.id, from: move.from, to: move.to, path: move.path });
          if (move.passedStart) {
            this.onPassStart();
          }
          this.emit("move_end", { playerId: player.id, cellId: move.to });
          this.sync();
          this.resolveLanding();
        });
      });
      return;
    }
    // 无移动：立即发出 outcome 让转盘开始转，结果文字由前端本地延迟到转完后再显示
    this.emit("player_acted", { playerId: player.id, action: "lucky_wheel", detail: outcome });
    this.wait(WHEEL_ANIM_MS + RESULT_VIEW_MS, () =>
      this.checkBankruptThen(() => this.finishEvent())
    );
  }

  // #58 锦鲤池
  private doKoiPond() {
    const player = this.state.currentPlayer;
    const outcome = koiReward();
    applyKoi(this.state, player.id, outcome.reward);
    // 扣款/加钱立即同步，但结果信息（tier/reward）延迟到骰子滚动结束后再发出
    if (outcome.reward > 0) {
      this.emit("cash_change", { playerId: player.id, amount: outcome.reward, reason: `锦鲤池·${outcome.tier}` });
    }
    this.sync();
    // 立即发 outcome 让骰子开始滚，结果文字由前端本地延迟 1s 后显示
    this.emit("player_acted", { playerId: player.id, action: "koi_pond", detail: outcome });
    this.wait(KOI_SHOW_MS, () => this.finishEvent());
  }

  // #42 社区彩票（自动结算）
  private doLottery() {
    const player = this.state.currentPlayer;
    const result = runLottery(this.state, player.id);
    for (const c of result.contributions) {
      if (c.amount > 0) {
        this.emit("cash_change", { playerId: c.playerId, amount: -c.amount, reason: "彩票投注" });
      }
    }
    for (const p of result.payouts) {
      this.emit("cash_change", { playerId: p.playerId, amount: p.amount, reason: "彩票中奖" });
    }
    this.sync();
    // 立即发 outcome 让骰子开始滚，结果文字本地延迟
    this.emit("player_acted", { playerId: player.id, action: "lottery", detail: result });
    this.wait(LOTTERY_SHOW_MS, () => this.finishEvent());
  }

  // 车站传送后结算对向站缴租
  private resolveTeleportRent(toCell: number) {
    const player = this.state.currentPlayer;
    const slot = this.state.board[toCell];
    if (slot.owner === null || slot.owner === player.id) {
      this.finishEvent();
      return;
    }
    const rent = computeRent(this.state, player.id, this.lastDiceTotal);
    if (rent.due) {
      this.settleRent(rent);
    }
    this.sync();
    this.checkBankruptThen(() => this.wait(EVENT_SHOW_MS, () => this.finishEvent()));
  }

  // 统一缴租结算：处理免租卡（freeRentCard）与安宁之愿（peace，租金减半取整¥10）。
  // 返回实际缴付金额（0 表示免付）。
  private settleRent(rent: { amount: number; fromId: string; toId: string | null; reason: string; cellId: number }) {
    const player = this.state.getPlayer(rent.fromId)!;

    // 免租卡优先
    if (player.freeRentCard) {
      player.freeRentCard = false;
      this.emit("player_acted", {
        playerId: player.id,
        action: "free_rent_used",
        detail: { cellId: rent.cellId },
      });
      return 0;
    }

    let amount = rent.amount;
    // 安宁之愿：租金减半，取整到 ¥10
    if (player.wish?.type === "peace") {
      amount = Math.floor((amount / 2) / 10) * 10;
      player.wish = null;
      this.emit("player_acted", {
        playerId: player.id,
        action: "wish_consumed",
        detail: { type: "peace" },
      });
    }

    const owner = rent.toId ? this.state.getPlayer(rent.toId) : null;
    if (owner) {
      player.cash -= amount;
      owner.cash += amount;
      this.emit("cash_change", { playerId: player.id, amount: -amount, reason: rent.reason });
      this.emit("cash_change", { playerId: owner.id, amount, reason: "收取租金" });
      this.emit("player_acted", {
        playerId: player.id,
        action: "pay_rent",
        detail: { amount, toId: owner.id },
      });
    }
    return amount;
  }

  // 构建可购买格子（地产/车站/公用事业）的富信息舞台内容：
  // 含价格、业主、房屋数、租金表、车站传送目标，供前端渲染完整地产卡。
  private buyableContent(cellId: number): any {
    const cell = Board.get(cellId);
    const slot = this.state.board[cellId];
    const owner = slot.owner ? this.state.getPlayer(slot.owner) : null;
    const meta = Board.getPropertyMeta(cellId);
    const base: any = {
      cellId,
      type: cell.type,
      name: cell.name,
      emoji: cell.emoji,
      group: cell.group ?? null,
      price: cell.type === "station" ? Board.stationPrice : cell.price ?? 0,
      ownerId: slot.owner,
      ownerNickname: owner?.nickname ?? null,
      ownerEmoji: owner?.emoji ?? null,
      buildings: slot.buildings,
      mortgaged: slot.mortgaged,
    };
    if (cell.type === "property" && meta) {
      base.rent = meta.rent;
      base.buildCost = meta.buildCost;
    } else if (cell.type === "station") {
      const tp = STATION_TELEPORT[cellId];
      base.teleportTo = tp ? tp.to : null;
      base.teleportName = tp ? Board.get(tp.to).name : null;
      base.stationCount = owner ? owner.stations.length : 0;
      base.currentRent = owner ? Board.stationRent(owner.stations.length) : 0;
    } else if (cell.type === "utility") {
      base.utilityCount = owner ? owner.utilities.length : 0;
      base.multiplier = owner ? Board.utilityMultiplier(owner.utilities.length) : 0;
    }
    return base;
  }

  // 可购买格子落地：无主→询问购买；有主→缴租
  private handleBuyableLanding(cellId: number, afterResolve?: () => void) {
    const player = this.state.currentPlayer;
    const cell = Board.get(cellId);
    const slot = this.state.board[cellId];

    this.emit("stage_start", {
      stage: 3,
      content: this.buyableContent(cellId),
    });

    if (slot.owner === null) {
      // 无主：询问购买
      const price = cell.type === "station" ? Board.stationPrice : cell.price ?? 0;
      this.awaitingBuy = true;
      this.state.phase = "input_required";
      this.pendingAfterBuy = afterResolve ?? null;
      this.emit("need_input", {
        inputType: "buy_property",
        options: { cellId, price, canAfford: player.cash >= price },
      });
      this.sync();
      return;
    }

    if (slot.owner !== player.id) {
      // 缴租（含免租卡/安宁之愿处理）
      const rent = computeRent(this.state, player.id, this.lastDiceTotal);
      if (rent.due) {
        this.settleRent(rent);
      }
    }

    this.sync();
    if (afterResolve) afterResolve();
    this.checkBankruptThen(() => this.wait(EVENT_SHOW_MS, () => this.finishEvent()));
  }

  private pendingAfterBuy: (() => void) | null = null;

  private doBuy(confirm: boolean) {
    const player = this.state.currentPlayer;
    this.awaitingBuy = false;

    if (confirm) {
      const res = buyProperty(this.state, player.id);
      if (res.ok) {
        this.boughtThisTurnCells.add(res.cellId);
        this.emit("property_change", { cellId: res.cellId, owner: player.id });
        this.emit("cash_change", {
          playerId: player.id,
          amount: -res.price,
          reason: "购买地产",
        });
        this.emit("player_acted", {
          playerId: player.id,
          action: "buy_property",
          detail: { cellId: res.cellId, price: res.price },
        });
      }
    } else {
      this.emit("player_acted", { playerId: player.id, action: "skip_buy", detail: {} });
    }

    this.sync();
    const after = this.pendingAfterBuy;
    this.pendingAfterBuy = null;
    if (after) after();
    this.finishEvent();
  }

  // 过起点：MovePlayer 已加 ¥200，这里处理财富之愿额外 +¥300（替代为 ¥500）并广播。
  private onPassStart() {
    const player = this.state.currentPlayer;
    if (player.wish?.type === "wealth") {
      player.cash += 300; // 200 已加，补足到 500
      player.wish = null;
      this.emit("cash_change", { playerId: player.id, amount: 500, reason: "经过起点·财富之愿" });
      this.emit("player_acted", { playerId: player.id, action: "wish_consumed", detail: { type: "wealth" } });
    } else {
      this.emit("cash_change", { playerId: player.id, amount: 200, reason: "经过起点" });
    }
  }

  // 事件结束 → 进入自由操作阶段
  private finishEvent() {
    this.emit("stage_end", { stage: 3 });
    this.state.phase = "free_action";
    this.emit("need_input", { inputType: "free_action", options: {} });
    this.sync();
  }

  // ── 卡牌效果应用 ──
  private applyCardEffect(effect: CardEffect) {
    const player = this.state.currentPlayer;

    // 现金直接变动
    if (effect.cashDelta) {
      player.cash += effect.cashDelta;
      this.emit("cash_change", {
        playerId: player.id,
        amount: effect.cashDelta,
        reason: effect.cashReason ?? "卡牌效果",
      });
    }

    // 出狱卡
    if (effect.jailCard) {
      player.getOutOfJailCards += 1;
      this.emit("player_acted", { playerId: player.id, action: "get_jail_card", detail: {} });
    }

    // 免租卡
    if (effect.freeRent) {
      player.freeRentCard = true;
      this.emit("player_acted", { playerId: player.id, action: "get_free_rent", detail: {} });
    }

    // 修缮：按建筑数扣款
    if (effect.repair) {
      const cost = repairCost(this.state, player.id, effect.repair.perHouse, effect.repair.perHotel);
      if (cost > 0) {
        player.cash -= cost;
        this.emit("cash_change", { playerId: player.id, amount: -cost, reason: "建筑修缮费" });
      }
    }

    // houses_bonus
    if (effect.housesBonus) {
      const bonus = housesBonusAmount(this.state, player.id, effect.housesBonus);
      if (bonus > 0) {
        player.cash += bonus;
        this.emit("cash_change", { playerId: player.id, amount: bonus, reason: "房产奖励" });
      }
    }

    // 多人结算（pay_all_50 / birthday）
    if (effect.perPlayer) {
      const others = this.state.players.filter((p) => p.id !== player.id && !p.bankrupt);
      for (const other of others) {
        if (effect.perPlayer > 0) {
          // 每人付给当前玩家
          other.cash -= effect.perPlayer;
          player.cash += effect.perPlayer;
          this.emit("cash_change", { playerId: other.id, amount: -effect.perPlayer, reason: "支付给他人" });
          this.emit("cash_change", { playerId: player.id, amount: effect.perPlayer, reason: "他人支付" });
        } else {
          // 当前玩家付给每人
          const amt = -effect.perPlayer;
          player.cash -= amt;
          other.cash += amt;
          this.emit("cash_change", { playerId: player.id, amount: -amt, reason: "支付给他人" });
          this.emit("cash_change", { playerId: other.id, amount: amt, reason: "他人支付" });
        }
      }
    }

    this.sync();

    // 入狱（卡牌）
    if (effect.goJail) {
      sendToJail(this.state, player.id);
      this.emit("player_acted", { playerId: player.id, action: "go_jail", detail: { reason: "卡牌" } });
      this.sync();
      this.finishEvent();
      return;
    }

    // 后退 N 格并触发目标格
    if (effect.back) {
      const move = movePlayer(this.state, player.id, -effect.back, false);
      this.emit("move_start", { playerId: player.id, from: move.from, to: move.to, path: move.path });
      this.emit("move_end", { playerId: player.id, cellId: move.to });
      this.sync();
      this.resolveLanding();
      return;
    }

    // 移动到目标格
    if (effect.moveTo) {
      const move = teleportTo(this.state, player.id, effect.moveTo.to, effect.moveTo.passStart);
      this.emit("teleport", {
        playerId: player.id,
        from: move.from,
        to: move.to,
        passedStart: effect.moveTo.passStart,
      });
      if (effect.moveTo.passStart) {
        this.onPassStart();
      }
      this.sync();
      this.resolveLanding();
      return;
    }

    // 前进到最近车站/公用事业
    if (effect.nearest) {
      const target =
        effect.nearest === "station_2x"
          ? findNearestStation(player.position)
          : findNearestUtility(player.position);
      const move = teleportTo(this.state, player.id, target, false);
      this.emit("teleport", { playerId: player.id, from: move.from, to: move.to, passedStart: false });
      this.sync();
      this.resolveNearestRent(effect.nearest);
      return;
    }

    // 卡牌简单效果（仅现金/出狱卡等）：走破产检查后再结束
    this.checkBankruptThen(() => this.wait(EVENT_SHOW_MS, () => this.finishEvent()));
  }

  // 卡牌驱动的最近车站/公用事业特殊缴租
  private resolveNearestRent(kind: "station_2x" | "utility_x10") {
    const player = this.state.currentPlayer;
    const cellId = player.position;
    const slot = this.state.board[cellId];

    // 无主：可购买
    if (slot.owner === null) {
      this.handleBuyableLanding(cellId);
      return;
    }
    if (slot.owner === player.id) {
      this.finishEvent();
      return;
    }

    const owner = this.state.getPlayer(slot.owner)!;
    let amount = 0;
    if (kind === "station_2x") {
      amount = Board.stationRent(owner.stations.length) * 2;
    } else {
      amount = this.lastDiceTotal * 10;
    }
    player.cash -= amount;
    owner.cash += amount;
    this.emit("cash_change", { playerId: player.id, amount: -amount, reason: "卡牌指定缴租" });
    this.emit("cash_change", { playerId: owner.id, amount, reason: "收取租金" });
    this.sync();
    this.finishEvent();
  }

  // ── 建房/卖房/抵押/赎回 ──
  private doBuild(cellId: number) {
    if (typeof cellId !== "number") return;
    const player = this.state.currentPlayer;
    // 规则: 必须踩到自己的地产才能建房
    if (player.position !== cellId) {
      this.emit("error", { message: "你必须站在该地产上才能建房" });
      return;
    }
    // 规则: 买地的回合不能在该地建房
    if (this.boughtThisTurnCells.has(cellId)) {
      this.emit("error", { message: "购买地产的回合不能立即建房" });
      return;
    }
    // 规则: 每回合只能建一次
    if (this.builtThisTurn) {
      this.emit("error", { message: "本回合已经建过房了" });
      return;
    }
    const res = buildHouse(this.state, player.id, cellId);
    if (!res.ok) {
      this.emit("error", { message: res.reason ?? "建房失败" });
      return;
    }
    this.builtThisTurn = true;
    this.emit("property_change", { cellId: res.cellId, buildings: res.level });
    this.emit("cash_change", { playerId: player.id, amount: -(res.cost ?? 0), reason: res.toHotel ? "建造酒店" : "建造房屋" });
    this.emit("player_acted", { playerId: player.id, action: "build_house", detail: { cellId, level: res.level } });
    this.sync();
  }

  private doSell(cellId: number, actingId?: string) {
    if (typeof cellId !== "number") return;
    const player = actingId ? this.state.getPlayer(actingId) : this.state.currentPlayer;
    if (!player) return;
    const res = sellHouse(this.state, player.id, cellId);
    if (!res.ok) {
      this.emit("error", { message: res.reason ?? "卖房失败" });
      return;
    }
    this.emit("property_change", { cellId: res.cellId, buildings: res.level });
    this.emit("cash_change", { playerId: player.id, amount: res.refund ?? 0, reason: "出售建筑" });
    this.emit("player_acted", { playerId: player.id, action: "sell_house", detail: { cellId, level: res.level } });
    this.sync();
    if (this.rescueDebtorId === player.id) this.checkRescueResolved();
  }

  private doMortgage(cellId: number, actingId?: string) {
    if (typeof cellId !== "number") return;
    const player = actingId ? this.state.getPlayer(actingId) : this.state.currentPlayer;
    if (!player) return;
    const res = mortgage(this.state, player.id, cellId);
    if (!res.ok) {
      this.emit("error", { message: res.reason ?? "抵押失败" });
      return;
    }
    this.emit("property_change", { cellId: res.cellId, mortgaged: true });
    this.emit("cash_change", { playerId: player.id, amount: res.amount ?? 0, reason: "抵押地产" });
    this.emit("player_acted", { playerId: player.id, action: "mortgage", detail: { cellId } });
    this.sync();
    if (this.rescueDebtorId === player.id) this.checkRescueResolved();
  }

  private doRedeem(cellId: number) {
    if (typeof cellId !== "number") return;
    const player = this.state.currentPlayer;
    const res = redeem(this.state, player.id, cellId);
    if (!res.ok) {
      this.emit("error", { message: res.reason ?? "赎回失败" });
      return;
    }
    this.emit("property_change", { cellId: res.cellId, mortgaged: false });
    this.emit("cash_change", { playerId: player.id, amount: -(res.amount ?? 0), reason: "赎回地产" });
    this.emit("player_acted", { playerId: player.id, action: "redeem", detail: { cellId } });
    this.sync();
  }

  // ── #16 擂台挑战 ──
  private doArena(targetId: string) {
    const player = this.state.currentPlayer;
    const target = this.state.getPlayer(targetId);
    if (!target || target.id === player.id || target.bankrupt || target.inJail) {
      this.emit("error", { message: "无效的对手" });
      return;
    }
    const outcome = fightArena(player.id, target.id);
    // 立即发骰子点数（让客户端 RollingDie 开始滚动），但结果（谁赢）延迟 1200ms 再发
    this.emit("arena_roll", {
      playerId: player.id,
      challengerRoll: outcome.challengerRoll,
      opponentRoll: outcome.opponentRoll,
      challengerId: player.id,
      opponentId: target.id,
    });
    // 扣款同步
    if (outcome.winnerId && outcome.loserId) {
      const winner = this.state.getPlayer(outcome.winnerId)!;
      const loser = this.state.getPlayer(outcome.loserId)!;
      loser.cash -= outcome.amount;
      winner.cash += outcome.amount;
      this.emit("cash_change", { playerId: loser.id, amount: -outcome.amount, reason: "擂台落败" });
      this.emit("cash_change", { playerId: winner.id, amount: outcome.amount, reason: "擂台获胜" });
    }
    this.sync();
    // 先播盲对决动画（~1s），再出结果 → 延时关闭
    this.wait(DICE_ANIM_MS, () => {
      this.emit("player_acted", {
        playerId: player.id,
        action: "arena",
        detail: { ...outcome, challengerId: player.id, opponentId: target.id },
      });
    });
    // 留出双骰对决动画时间
    this.wait(ARENA_SHOW_MS, () => this.checkBankruptThen(() => this.finishEvent()));
  }

  // ── 擂台回合制摇骰 ──
  // 双方同时各自摇骰，不限制先后。任一方的骰值一到位就广播。
  private doArenaRoll(playerId: string) {
    if (!this.arenaFight) return;
    const f = this.arenaFight;
    const roll = rollOne();

    if (playerId === f.challengerId && f.challengerRoll == null) {
      f.challengerRoll = roll;
      this.emit("arena_roll", { challengerRoll: roll, challengerId: f.challengerId, opponentId: f.opponentId, rollerId: playerId });
    } else if (playerId === f.opponentId && f.opponentRoll == null) {
      f.opponentRoll = roll;
      this.emit("arena_roll", { opponentRoll: roll, challengerId: f.challengerId, opponentId: f.opponentId, rollerId: playerId });
    } else {
      return; // 已摇或无效
    }

    if (f.challengerRoll != null && f.opponentRoll != null) {
      this.resolveArenaFight();
    }
  }

  private resolveArenaFight() {
    const f = this.arenaFight!;
    const a = f.challengerRoll!;
    const b = f.opponentRoll!;
    let winnerId: string | null = null;
    let loserId: string | null = null;
    let amount = 0;
    if (a > b) { winnerId = f.challengerId; loserId = f.opponentId; amount = 150; }
    else if (b > a) { winnerId = f.opponentId; loserId = f.challengerId; amount = 150; }

    if (winnerId && loserId) {
      const winner = this.state.getPlayer(winnerId)!;
      const loser = this.state.getPlayer(loserId)!;
      loser.cash -= amount;
      winner.cash += amount;
      this.emit("cash_change", { playerId: loser.id, amount: -amount, reason: "擂台落败" });
      this.emit("cash_change", { playerId: winner.id, amount: amount, reason: "擂台获胜" });
    }
    this.sync();
    // 广播对决结果
    this.wait(DICE_ANIM_MS, () => {
      this.emit("player_acted", {
        playerId: f.challengerId,
        action: "arena",
        detail: { challengerRoll: a, opponentRoll: b, winnerId, loserId, amount },
      });
    });
    this.wait(ARENA_SHOW_MS, () => {
      this.arenaFight = null;
      this.checkBankruptThen(() => this.finishEvent());
    });
  }

  // ── #25 许愿喷泉 ──
  private doWish(option: "A" | "B" | "C" | "skip") {
    const player = this.state.currentPlayer;
    if (option === "skip") {
      this.emit("player_acted", { playerId: player.id, action: "wish_skip", detail: {} });
      this.sync();
      this.finishEvent();
      return;
    }
    if (option !== "A" && option !== "B" && option !== "C") {
      this.emit("error", { message: "无效的许愿选项" });
      return;
    }
    const res = makeWish(this.state, player.id, option);
    if (!res.ok) {
      this.emit("error", { message: res.reason ?? "许愿失败" });
      return;
    }
    this.emit("cash_change", { playerId: player.id, amount: -(res.cost ?? 0), reason: "许愿喷泉" });
    this.emit("player_acted", { playerId: player.id, action: "wish", detail: { option, wish: res.wish } });
    this.sync();
    this.finishEvent();
  }

  // ── #33 黑市商人 ──
  private doBlackMarket(option: "A" | "B" | "skip", targetCellId?: number) {
    const player = this.state.currentPlayer;
    if (option === "skip") {
      this.emit("player_acted", { playerId: player.id, action: "blackmarket_skip", detail: {} });
      this.sync();
      this.finishEvent();
      return;
    }
    if (typeof targetCellId !== "number") {
      this.emit("error", { message: "请选择目标地产" });
      return;
    }
    const res =
      option === "A"
        ? blackMarketBuy(this.state, player.id, targetCellId)
        : blackMarketSell(this.state, player.id, targetCellId);
    if (!res.ok) {
      this.emit("error", { message: res.reason ?? "黑市交易失败" });
      return;
    }
    this.emit("property_change", { cellId: res.cellId, owner: this.state.board[res.cellId].owner });
    this.emit("cash_change", {
      playerId: player.id,
      amount: res.bought ? -(res.price ?? 0) : res.price ?? 0,
      reason: res.bought ? "黑市购房" : "黑市套现",
    });
    this.emit("player_acted", {
      playerId: player.id,
      action: "blackmarket",
      detail: { option, cellId: res.cellId, price: res.price, bought: res.bought },
    });
    this.sync();
    this.finishEvent();
  }

  // ── #50 拆迁办 ──
  private doDemolish(cellId: number | null) {
    const player = this.state.currentPlayer;
    if (cellId === null) {
      this.emit("player_acted", { playerId: player.id, action: "demolish_skip", detail: {} });
      this.sync();
      this.finishEvent();
      return;
    }
    const res = demolish(this.state, player.id, cellId);
    if (!res.ok) {
      this.emit("error", { message: res.reason ?? "拆迁失败" });
      return;
    }
    this.emit("property_change", { cellId: res.cellId, buildings: res.newLevel });
    this.emit("cash_change", { playerId: player.id, amount: res.compensation ?? 0, reason: "拆迁补偿" });
    this.emit("player_acted", {
      playerId: player.id,
      action: "demolish",
      detail: { cellId: res.cellId, newLevel: res.newLevel },
    });
    this.sync();
    this.finishEvent();
  }

  // ── 交易 ──
  private doTradeOffer(fromId: string, payload: any) {
    if (!payload || typeof payload.toId !== "string") {
      this.emit("error", { message: "无效的交易请求" });
      return;
    }
    if (this.state.pendingTrade) {
      this.emit("error", { message: "已有待处理的交易" });
      return;
    }
    const target = this.state.getPlayer(payload.toId);
    if (!target || target.id === fromId || target.bankrupt) {
      this.emit("error", { message: "无效的交易对象" });
      return;
    }
    const offer: TradeOffer = {
      id: "t_" + Math.random().toString(36).slice(2, 9),
      fromId,
      toId: payload.toId,
      giveCash: Math.max(0, Math.floor(payload.giveCash ?? 0)),
      giveProperties: Array.isArray(payload.giveProperties) ? payload.giveProperties : [],
      giveJailCards: Math.max(0, Math.floor(payload.giveJailCards ?? 0)),
      wantCash: Math.max(0, Math.floor(payload.wantCash ?? 0)),
      wantProperties: Array.isArray(payload.wantProperties) ? payload.wantProperties : [],
      wantJailCards: Math.max(0, Math.floor(payload.wantJailCards ?? 0)),
    };
    const valid = validateTrade(this.state, offer);
    if (!valid.ok) {
      this.emit("error", { message: valid.reason ?? "交易不合法" });
      return;
    }
    this.state.pendingTrade = offer;
    this.emit("player_acted", { playerId: fromId, action: "trade_offer", detail: { offer } });
    this.emit("need_input", { inputType: "trade_respond", options: { offer } });
    this.sync();
  }

  private doTradeRespond(responderId: string, tradeId: string, accept: boolean) {
    const offer = this.state.pendingTrade;
    if (!offer || offer.id !== tradeId) return;
    if (responderId !== offer.toId) return;

    if (!accept) {
      this.state.pendingTrade = null;
      this.emit("player_acted", { playerId: responderId, action: "trade_declined", detail: { tradeId } });
      this.sync();
      this.finishEvent();
      return;
    }

    // 接受前再次校验（双方资产可能已变化）
    const valid = validateTrade(this.state, offer);
    if (!valid.ok) {
      this.state.pendingTrade = null;
      this.emit("error", { message: valid.reason ?? "交易已失效" });
      this.sync();
      this.finishEvent();
      return;
    }
    executeTrade(this.state, offer);
    this.state.pendingTrade = null;
    // 广播双方资产变化
    for (const cellId of offer.giveProperties) this.emit("property_change", { cellId, owner: offer.toId });
    for (const cellId of offer.wantProperties) this.emit("property_change", { cellId, owner: offer.fromId });
    this.emit("player_acted", { playerId: responderId, action: "trade_accepted", detail: { tradeId } });
    this.sync();
    this.finishEvent();
  }

  // ── 破产检测：当前玩家现金为负时进入自救（卖房/抵押），补足前暂停流程 ──
  // onDone 在检测/自救完成后调用（用于继续流程）。
  private checkBankruptThen(onDone: () => void) {
    // 找第一个现金为负且未破产的玩家（通常是当前玩家）
    const debtor = this.state.players.find((p) => !p.bankrupt && p.cash < 0);
    if (debtor) {
      // 进入自救模式：暂停流程，等该玩家卖房/抵押补足现金或声明破产
      this.rescueDebtorId = debtor.id;
      this.rescueResume = onDone;
      this.state.phase = "input_required";
      this.emit("need_input", {
        inputType: "rescue",
        options: {
          debtorId: debtor.id,
          deficit: -debtor.cash,
          canRecover: liquidationValue(this.state, debtor.id) >= 0,
        },
      });
      this.sync();
      return;
    }
    // 无人欠款：检查游戏结束后继续
    if (this.state.isGameOver()) {
      this.gameOver();
      return;
    }
    onDone();
  }

  // 自救期间：玩家每次卖房/抵押后调用，检查是否已补足
  private checkRescueResolved() {
    if (!this.rescueDebtorId) return;
    const debtor = this.state.getPlayer(this.rescueDebtorId);
    if (!debtor) {
      this.rescueDebtorId = null;
      this.rescueResume = null;
      return;
    }
    if (debtor.cash >= 0) {
      // 已补足：退出自救，继续原流程
      this.emit("player_acted", { playerId: debtor.id, action: "rescue_resolved", detail: {} });
      const resume = this.rescueResume;
      this.rescueDebtorId = null;
      this.rescueResume = null;
      if (this.state.isGameOver()) {
        this.gameOver();
        return;
      }
      if (resume) resume();
    } else {
      // 仍欠款：刷新自救面板（更新缺口/是否还有可变现资产）
      this.emit("need_input", {
        inputType: "rescue",
        options: {
          debtorId: debtor.id,
          deficit: -debtor.cash,
          canRecover: liquidationValue(this.state, debtor.id) >= 0,
        },
      });
      this.sync();
    }
  }

  // 玩家声明破产（自救放弃）或资不抵债 → 真正破产，资产归还银行
  private doDeclareBankrupt(playerId: string) {
    if (this.rescueDebtorId !== playerId) return;
    const res = bankruptPlayer(this.state, playerId, null);
    this.emit("bankrupt", { playerId, creditorId: res.creditorId });
    for (const cellId of res.transferredCells) {
      this.emit("property_change", {
        cellId,
        owner: this.state.board[cellId].owner,
        buildings: this.state.board[cellId].buildings,
        mortgaged: this.state.board[cellId].mortgaged,
      });
    }
    const resume = this.rescueResume;
    this.rescueDebtorId = null;
    this.rescueResume = null;
    this.sync();
    if (this.state.isGameOver()) {
      this.gameOver();
      return;
    }
    if (resume) resume();
  }

  // ── 出狱处理 ──
  private doJailPay() {
    const player = this.state.currentPlayer;
    if (player.cash < 75) return;
    player.cash -= 75;
    player.inJail = false;
    player.jailTurns = 0;
    this.emit("cash_change", { playerId: player.id, amount: -75, reason: "支付保释金" });
    this.emit("player_acted", { playerId: player.id, action: "jail_pay", detail: {} });
    this.state.consecutiveDoubles = 0;
    this.state.phase = "rolling";
    this.emit("stage_start", { stage: 1, content: { playerId: player.id, luckWish: player.wish?.type === "luck" } });
    this.sync();
  }

  private doJailCard() {
    const player = this.state.currentPlayer;
    if (player.getOutOfJailCards <= 0) return;
    player.getOutOfJailCards -= 1;
    player.inJail = false;
    player.jailTurns = 0;
    this.emit("player_acted", { playerId: player.id, action: "jail_card", detail: {} });
    this.state.consecutiveDoubles = 0;
    this.state.phase = "rolling";
    this.emit("stage_start", { stage: 1, content: { playerId: player.id, luckWish: player.wish?.type === "luck" } });
    this.sync();
  }

  private doJailRoll() {
    const player = this.state.currentPlayer;
    const roll = performRoll(this.state);
    this.state.consecutiveDoubles = 0; // 狱中掷骰不计入连续双骰

    // 先发骰子结果，延后关闭舞台/移动，给骰子滚动动画留时间
    this.emit("dice_result", {
      dice: roll.roll.dice,
      isDouble: roll.roll.isDouble,
      consecutiveDoubles: 0,
    });

    if (roll.roll.isDouble) {
      // 掷出双骰：等待骰子动画完成后再出狱并移动
      this.wait(DICE_SHOW_MS, () => {
        player.inJail = false;
        player.jailTurns = 0;
        this.emit("player_acted", { playerId: player.id, action: "jail_roll", detail: { success: true } });
        this.emit("stage_end", { stage: 1 });
        this.lastDiceTotal = roll.roll.total;
        this.state.phase = "moving";
        this.moveAndResolve(roll.roll.total);
      });
      return;
    }

    // 失败：增加狱中回合数
    player.jailTurns += 1;
    if (player.jailTurns >= 3) {
      // 第三回合强制付保释金（现金不足则进入破产流程，Phase 1 允许负数）
      this.wait(DICE_SHOW_MS, () => {
        player.cash -= 75;
        player.inJail = false;
        player.jailTurns = 0;
        this.emit("cash_change", { playerId: player.id, amount: -75, reason: "强制保释金" });
        this.emit("player_acted", { playerId: player.id, action: "jail_forced", detail: {} });
        this.emit("stage_end", { stage: 1 });
        this.lastDiceTotal = roll.roll.total;
        this.state.phase = "moving";
        this.moveAndResolve(roll.roll.total);
      });
      return;
    }

    // 未出狱：等待动画展示后结束回合
    this.wait(DICE_SHOW_MS, () => {
      this.emit("player_acted", { playerId: player.id, action: "jail_roll", detail: { success: false } });
      this.emit("stage_end", { stage: 1 });
      this.state.phase = "free_action";
      this.state.nextTurn();
      this.beginTurn();
    });
  }

  private endTurn() {
    const player = this.state.currentPlayer;
    // 双骰且未入狱 → 再掷一次
    const rollAgain =
      this.state.consecutiveDoubles > 0 && !player.inJail && !player.bankrupt;

    if (rollAgain) {
      this.rollingLocked = false;
      this.state.phase = "rolling";
      this.emit("stage_start", { stage: 1, content: { playerId: player.id, luckWish: player.wish?.type === "luck" } });
      this.sync();
      return;
    }

    this.state.nextTurn();
    this.beginTurn();
  }

  // 监狱探访（路过）—— 供后续扩展
  isJustVisiting(cellId: number): boolean {
    return cellId === JAIL_VISIT_CELL;
  }
}
