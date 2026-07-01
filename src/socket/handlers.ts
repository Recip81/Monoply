import type { Socket } from "socket.io-client";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";
import { mapData } from "@/utils/cellPositions";
import { Sound } from "@/utils/sound";

// 将服务端事件映射到 store 更新。
export function registerHandlers(socket: Socket) {
  const game = () => useGameStore.getState();
  const ui = () => useUiStore.getState();
  const sock = () => useSocketStore.getState();

  // ── 大厅事件 ──
  socket.on("room_created", ({ roomId, playerId }) => {
    sock().setSession(roomId, playerId);
    game().setMyPlayerId(playerId);
  });

  socket.on("room_joined", ({ roomId, playerId, players }) => {
    sock().setSession(roomId, playerId);
    game().setMyPlayerId(playerId);
    if (players) sock().setLobby(players, sock().hostId ?? "");
  });

  socket.on("room_update", ({ players, hostId }) => {
    sock().setLobby(players, hostId);
  });

  // 开局掷骰定顺序：收到后 gameStore 设 preRollPhase = true
  socket.on("game_pre_roll", (data: { players: any[] }) => {
    useGameStore.setState({ started: false } as any);
    useUiStore.getState().clearInput();
    // 用 uiStore 存 pre-roll 状态
    useUiStore.setState({ preRollPlayers: data.players } as any);
  });

  socket.on("game_starting", () => {
    ui().pushToast("游戏开始！", "success");
    useUiStore.setState({ preRollPlayers: null } as any);
  });

  // 完整状态同步
  socket.on("state_sync", ({ state }) => {
    // 重连后内存中的 myPlayerId 可能丢失，用 socket 会话里的 playerId 恢复
    if (!game().myPlayerId) {
      const pid = sock().playerId;
      if (pid) game().setMyPlayerId(pid);
    }
    game().syncState(state);
  });

  socket.on("turn_begin", ({ playerId, turnNumber }) => {
    const p = game().players.find((x) => x.id === playerId);
    ui().pushToast(`回合 #${turnNumber} · ${p?.nickname ?? ""}`, "info");
  });

  // 舞台
  socket.on("stage_start", ({ stage, content }) => {
    if (stage === 1) {
      ui().showStage("dice", content);
      ui().clearDice();
    } else if (stage === 3) {
      // 趣味格用专属舞台类型
      if (content?.type === "fun" && content.funType) {
        const map: Record<string, any> = {
          lucky_wheel: "wheel",
          arena: "arena",
          wish_fountain: "wish",
          black_market: "black_market",
          lottery: "lottery",
          demolition: "demolition",
          koi_pond: "koi",
        };
        ui().showStage(map[content.funType] ?? "event", content);
      } else {
        ui().showStage("event", content);
      }
    }
  });

  socket.on("stage_end", ({ stage }) => {
    // 第一幕结束后短暂保留骰子结果，再由后续阶段切换
    if (stage === 3) {
      // 事件结束，等待自由操作；舞台由 need_input/free_action 控制隐藏
    }
  });

  // 骰子结果
  socket.on("dice_result", ({ dice, isDouble }) => {
    ui().showStage("dice", { dice, isDouble });
    ui().setDice(dice, isDouble);
    Sound.play("dice");
  });

  // 擂台对决骰子：不打开 DiceStage，只合并骰子数值到当前舞台（让 RollingDie 开始滚动）
  // 注意：第二次收到 opponentRoll 时需要合并而非替换，否则 challengerRoll 会丢失
  socket.on("arena_roll", (data) => {
    const prev = useUiStore.getState().stageContent?.arenaDice ?? {};
    ui().mergeStageContent({ arenaDice: { ...prev, ...data } });
  });

  // 移动动画
  socket.on("move_start", ({ playerId, from, to, path }) => {
    ui().hideStage();
    ui().setMoveAnim({ playerId, from, to, path });
    Sound.play("move");
  });

  socket.on("move_end", ({ playerId, cellId }) => {
    game().updatePlayer(playerId, { position: cellId });
  });

  socket.on("teleport", ({ playerId, to, passedStart }) => {
    game().updatePlayer(playerId, { position: to });
    if (passedStart) ui().pushToast("经过起点 +¥200", "success");
    Sound.play("teleport");
  });

  // 现金变动
  socket.on("cash_change", ({ playerId, amount, reason }) => {
    const p = game().players.find((x) => x.id === playerId);
    if (p) game().updatePlayer(playerId, { cash: p.cash + amount });
    const sign = amount >= 0 ? "+" : "";
    const name = p?.nickname ?? "";
    ui().pushToast(`${name} ${reason} ${sign}¥${amount}`, amount >= 0 ? "success" : "warn");
    // 金币飘字（绑定到该玩家卡片）
    if (amount !== 0) ui().pushCoin(playerId, amount);
    if (reason.includes("起点")) Sound.play("start");
    else if (reason.includes("租")) Sound.play("rent");
    else if (reason.includes("税")) Sound.play("tax_pay");
    else Sound.play("coin");
  });

  // 地产变动
  socket.on("property_change", ({ cellId, owner, buildings, mortgaged }) => {
    const partial: any = {};
    if (owner !== undefined) partial.owner = owner;
    if (buildings !== undefined) partial.buildings = buildings;
    if (mortgaged !== undefined) partial.mortgaged = mortgaged;
    game().updateCell(cellId, partial);
  });

  // 抽卡：把卡片内容塞进当前事件舞台
  socket.on("card_drawn", ({ deckType, card, playerId }) => {
    const p = game().players.find((x) => x.id === playerId);
    const deckName = deckType === "fate" ? "命运" : "公共基金";
    Sound.play(deckType === "fate" ? "fate_card" : "card");
    ui().showStage("event", {
      type: deckType,
      name: deckName,
      emoji: deckType === "fate" ? "❓" : "🏦",
      card,
    });
    ui().pushToast(`${p?.nickname ?? ""} 抽到「${card.description}」`, "info");
    ui().pushLog(`${p?.nickname ?? ""} 抽${deckName}卡：${card.description}`);
  });

  // 需要输入
  socket.on("need_input", ({ inputType, options }) => {
    if (inputType === "free_action") {
      ui().clearInput();
      ui().hideStage();
    } else {
      ui().requireInput(inputType, options);
    }
  });

  socket.on("player_acted", ({ playerId, action, detail }) => {
    const p = game().players.find((x) => x.id === playerId);
    const name = p?.nickname ?? "";
    const cellName = (id?: number) => (id != null ? mapData[id]?.name ?? "" : "");
    if (action === "buy_property") {
      ui().pushToast(`${name} 购买了 ${cellName(detail.cellId)}`, "success");
      ui().pushLog(`${name} 购买了 ${cellName(detail.cellId)}`);
    } else if (action === "skip_buy") {
      ui().pushToast(`${name} 放弃购买`, "info");
    } else if (action === "go_jail") {
      ui().pushToast(`${name} 入狱了 🔒`, "warn");
      ui().pushLog(`${name} 入狱了`);
      Sound.play("jail_slam");
    } else if (action === "pay_rent") {
      ui().pushLog(`${name} 缴租 ¥${detail.amount}`);
    } else if (action === "build_house") {
      const lvl = detail.level === 5 ? "酒店" : `${detail.level} 级房屋`;
      ui().pushToast(`${name} 在 ${cellName(detail.cellId)} 建至${lvl}`, "success");
      ui().pushLog(`${name} 在 ${cellName(detail.cellId)} 建至${lvl}`);
      Sound.play(detail.level === 5 ? "hotel" : "build");
    } else if (action === "sell_house") {
      ui().pushToast(`${name} 出售了 ${cellName(detail.cellId)} 的建筑`, "info");
      Sound.play("sell");
    } else if (action === "mortgage") {
      ui().pushToast(`${name} 抵押了 ${cellName(detail.cellId)}`, "warn");
      Sound.play("mortgage");
    } else if (action === "redeem") {
      ui().pushToast(`${name} 赎回了 ${cellName(detail.cellId)}`, "success");
      Sound.play("redeem");
    } else if (action === "pay_tax") {
      ui().pushLog(`${name} 缴税 ¥${detail.amount}`);
      Sound.play("tax_pay");
    } else if (action === "get_jail_card") {
      ui().pushToast(`${name} 获得出狱通行证 🎫`, "success");
    } else if (action === "get_free_rent") {
      ui().pushToast(`${name} 获得免租卡`, "success");
    } else if (action === "free_rent_used") {
      ui().pushToast(`${name} 使用免租卡，本次免租`, "success");
    } else if (action === "jail_pay" || action === "jail_forced") {
      ui().pushToast(`${name} 支付保释金出狱`, "info");
    } else if (action === "jail_card") {
      ui().pushToast(`${name} 使用通行证出狱`, "info");
    } else if (action === "jail_roll") {
      ui().pushToast(detail.success ? `${name} 掷出双骰，出狱！` : `${name} 未掷出双骰，留在狱中`, "info");
    } else if (action === "lucky_wheel") {
      ui().mergeStageContent({ outcome: detail });
      ui().pushToast(`${name} 幸运转盘：${detail.label}`, "info");
      ui().pushLog(`${name} 幸运转盘：${detail.label}`);
      Sound.play("wheel_spin");
      Sound.play(detail.cash != null ? (detail.cash >= 0 ? "wheel_good" : "wheel_bad") : "wheel_spin");
    } else if (action === "koi_pond") {
      ui().mergeStageContent({ outcome: detail });
      ui().pushToast(`${name} 锦鲤池：${detail.tier}（¥${detail.reward}）`, detail.reward > 0 ? "success" : "info");
      ui().pushLog(`${name} 锦鲤池：${detail.tier} ¥${detail.reward}`);
      Sound.play(detail.reward >= 500 ? "koi_win" : "koi_roll");
    } else if (action === "lottery") {
      ui().mergeStageContent({ outcome: detail });
      ui().pushToast(`${name} 触发社区彩票`, "info");
      ui().pushLog(`社区彩票开奖`);
      Sound.play("lottery_draw");
      Sound.play(detail.payouts?.length > 0 ? "lottery_win" : "lottery_draw");
    } else if (action === "arena") {
      ui().mergeStageContent({ outcome: detail });
      const winner = detail.winnerId ? game().players.find((x) => x.id === detail.winnerId) : null;
      ui().pushToast(winner ? `擂台：${winner.nickname} 获胜` : "擂台：平局", "info");
      ui().pushLog(`${name} 擂台挑战`);
      Sound.play("arena_fight");
      Sound.play("arena_result");
    } else if (action === "wish") {
      ui().pushToast(`${name} 许下心愿`, "success");
      ui().pushLog(`${name} 许愿喷泉`);
    } else if (action === "wish_consumed") {
      ui().pushToast(`${name} 的愿望生效了 ✨`, "success");
    } else if (action === "wish_skip" || action === "blackmarket_skip" || action === "demolish_skip" || action === "arena_skip") {
      ui().pushToast(`${name} 放弃了操作`, "info");
    } else if (action === "blackmarket") {
      ui().pushToast(detail.bought ? `${name} 黑市购入 ${cellName(detail.cellId)}` : `${name} 黑市套现 ${cellName(detail.cellId)}`, "info");
      ui().pushLog(`${name} 黑市${detail.bought ? "购房" : "套现"}：${cellName(detail.cellId)}`);
    } else if (action === "demolish") {
      ui().pushToast(`${name} 拆除了 ${cellName(detail.cellId)} 的房屋`, "warn");
      ui().pushLog(`${name} 拆迁：${cellName(detail.cellId)}`);
    } else if (action === "trade_offer") {
      ui().pushToast(`${name} 发起了交易请求`, "info");
      Sound.play("trade_offer");
    } else if (action === "trade_accepted") {
      ui().closeTrade();
      ui().pushToast(`✅ ${name} 接受了交易，交易达成 🤝`, "success");
      ui().pushLog(`交易达成（${name} 接受）`);
      Sound.play("trade_accept");
    } else if (action === "trade_declined") {
      ui().closeTrade();
      ui().pushToast(`❌ ${name} 拒绝了交易`, "warn");
      ui().pushLog(`交易被 ${name} 拒绝`);
    }
  });

  socket.on("game_over", ({ winnerId, scores }) => {
    const p = game().players.find((x) => x.id === winnerId);
    ui().pushToast(`游戏结束！胜者：${p?.nickname ?? "无"} 🏆`, "success");
    // 兜底：清掉可能残留的输入（如宣告破产后未关闭的自救面板），避免盖在结算页上
    ui().clearInput();
    ui().hideStage();
    ui().showGameOver(winnerId ?? null, scores ?? []);
    useGameStore.setState({ phase: "game_over" });
    Sound.play("win");
  });

  socket.on("bankrupt", ({ playerId }) => {
    game().updatePlayer(playerId, { bankrupt: true });
    const p = game().players.find((x) => x.id === playerId);
    ui().pushToast(`${p?.nickname ?? ""} 破产了`, "error");
    Sound.play("bankrupt");
  });

  // 重连失败（房间不存在或已结束）：清理本地会话，返回大厅
  socket.on("rejoin_failed", () => {
    sock().clearSession();
    game().reset();
    ui().pushToast("房间已失效，请重新创建或加入", "warn");
  });

  socket.on("error", ({ message }) => {
    ui().pushToast(message, "error");
  });
}
