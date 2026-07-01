import type { GameState } from "../GameState.js";
import type { FateCard, FundCard } from "@shared/types";
import { drawFate, drawFund } from "../CardDeck.js";
import { Board } from "../Board.js";

// 卡牌抽取结果：卡定义 + 一组待执行的副作用（由 TurnManager 落实并广播）。
export interface CardEffect {
  // 现金变动（对当前玩家）
  cashDelta?: number;
  cashReason?: string;
  // 移动到目标格（经起点收 ¥200）
  moveTo?: { to: number; passStart: boolean };
  // 后退步数
  back?: number;
  // 入狱
  goJail?: boolean;
  // 出狱卡 +1
  jailCard?: boolean;
  // 设置免租卡
  freeRent?: boolean;
  // 前进到最近车站/公用事业，并标记特殊缴租
  nearest?: "station_2x" | "utility_x10";
  // 与其他玩家结算：当前玩家从每位其他玩家收/付
  // perPlayer > 0 表示每位其他玩家付给当前玩家；< 0 表示当前玩家付给每人
  perPlayer?: number;
  // 修缮：按建筑数扣款
  repair?: { perHouse: number; perHotel: number };
  // houses_bonus：拥有 ≥3 栋房屋的地产每块 +¥50
  housesBonus?: number;
}

export interface CardDrawResult {
  deckType: "fate" | "fund";
  card: FateCard | FundCard;
  effect: CardEffect;
}

// 最近的车站/公用事业（从当前位置向前找）
function nearestCell(from: number, cellIds: number[]): number {
  const count = Board.count;
  for (let step = 1; step <= count; step++) {
    const pos = (from + step) % count;
    if (cellIds.includes(pos)) return pos;
  }
  return cellIds[0];
}

// 解析 effect 字符串 → CardEffect
function parseEffect(effect: string): CardEffect {
  // +N / -N 直接增减现金
  if (/^[+-]\d+$/.test(effect)) {
    const delta = parseInt(effect, 10);
    return { cashDelta: delta, cashReason: delta >= 0 ? "卡牌收入" : "卡牌支出" };
  }

  switch (effect) {
    case "go_start":
      return { moveTo: { to: 0, passStart: false }, cashDelta: 200, cashReason: "前进到起点" };
    case "go_56":
      return { moveTo: { to: Board.cellIdByName("香港"), passStart: true } };
    case "go_55":
      return { moveTo: { to: Board.cellIdByName("上海"), passStart: true } };
    case "go_9":
      return { moveTo: { to: Board.cellIdByName("桂林"), passStart: true } };
    case "back_2":
      return { back: 2 };
    case "back_3":
      return { back: 3 };
    case "back_4_cash_150":
      return { back: 4, cashDelta: 150, cashReason: "航空公司赔偿" };
    case "go_kunming":
      return { moveTo: { to: Board.cellIdByName("昆明"), passStart: true } };
    case "go_jail":
      return { goJail: true };
    case "jail_card":
      return { jailCard: true };
    case "free_rent":
      return { freeRent: true };
    case "nearest_station_2x":
      return { nearest: "station_2x" };
    case "nearest_utility_x10":
      return { nearest: "utility_x10" };
    case "pay_all_50":
      return { perPlayer: -50 };
    case "pay_all_40_to_me":
      return { perPlayer: 40 };
    case "birthday":
      return { perPlayer: 10 };
    case "birthday_15":
      return { perPlayer: 15 };
    case "repair":
      return { repair: { perHouse: 25, perHotel: 100 } };
    case "street_repair":
      return { repair: { perHouse: 40, perHotel: 115 } };
    case "repair_40_150":
      return { repair: { perHouse: 40, perHotel: 150 } };
    case "houses_bonus":
      return { housesBonus: 50 };
    case "+30_jail_card":
      return { cashDelta: 30, cashReason: "社区大扫除奖", jailCard: true };
    default:
      return {};
  }
}

export function drawCard(
  state: GameState,
  playerId: string,
  deckType: "fate" | "fund"
): CardDrawResult {
  if (deckType === "fate") {
    const out = drawFate(state.fateDeck, state.fateIndex);
    state.fateDeck = out.deck;
    state.fateIndex = out.index;
    return { deckType, card: out.card, effect: parseEffect(out.card.effect) };
  } else {
    const out = drawFund(state.fundDeck, state.fundIndex);
    state.fundDeck = out.deck;
    state.fundIndex = out.index;
    return { deckType, card: out.card, effect: parseEffect(out.card.effect) };
  }
}

// 计算修缮费用
export function repairCost(
  state: GameState,
  playerId: string,
  perHouse: number,
  perHotel: number
): number {
  const player = state.getPlayer(playerId)!;
  let houses = 0;
  let hotels = 0;
  for (const cellId of player.properties) {
    const b = state.board[cellId].buildings;
    if (b === 5) hotels += 1;
    else houses += b;
  }
  return houses * perHouse + hotels * perHotel;
}

// houses_bonus：拥有 ≥3 栋房屋（含酒店）的地产，每块奖励
export function housesBonusAmount(
  state: GameState,
  playerId: string,
  perProperty: number
): number {
  const player = state.getPlayer(playerId)!;
  let count = 0;
  for (const cellId of player.properties) {
    if (state.board[cellId].buildings >= 3) count += 1;
  }
  return count * perProperty;
}

// 最近车站/公用事业 cellId
export function findNearestStation(from: number): number {
  return nearestCell(from, Board.allStations());
}
export function findNearestUtility(from: number): number {
  return nearestCell(from, Board.allUtilities());
}
