import type { GameState } from "../GameState.js";
import type { TradeOffer } from "@shared/types";
import { Board } from "../Board.js";

export interface TradeValidation {
  ok: boolean;
  reason?: string;
}

// 校验一方是否真正拥有所列资产、地产是否无房屋、现金/出狱卡是否充足。
function validateSide(
  state: GameState,
  playerId: string,
  cash: number,
  properties: number[],
  jailCards: number
): TradeValidation {
  const p = state.getPlayer(playerId);
  if (!p) return { ok: false, reason: "玩家不存在" };
  if (cash < 0) return { ok: false, reason: "现金不能为负" };
  if (p.cash < cash) return { ok: false, reason: `${p.nickname} 现金不足` };
  if (jailCards < 0) return { ok: false, reason: "出狱卡不能为负" };
  if (p.getOutOfJailCards < jailCards)
    return { ok: false, reason: `${p.nickname} 出狱卡不足` };

  for (const cellId of properties) {
    const slot = state.board[cellId];
    if (!slot || slot.owner !== playerId)
      return { ok: false, reason: "包含非本人持有的资产" };
    if (slot.buildings > 0)
      return { ok: false, reason: "有房屋的地产不可交易，请先卖房" };
  }
  return { ok: true };
}

// 把一块资产从 fromId 转给 toId，更新双方 properties/stations/utilities 列表与 owner。
export function transferAsset(state: GameState, cellId: number, fromId: string, toId: string) {
  const cell = Board.get(cellId);
  const from = state.getPlayer(fromId);
  const to = state.getPlayer(toId);
  const slot = state.board[cellId];
  if (!from || !to || !slot) return;

  const remove = (arr: number[]) => {
    const i = arr.indexOf(cellId);
    if (i >= 0) arr.splice(i, 1);
  };

  if (cell.type === "property") {
    remove(from.properties);
    to.properties.push(cellId);
  } else if (cell.type === "station") {
    remove(from.stations);
    to.stations.push(cellId);
  } else if (cell.type === "utility") {
    remove(from.utilities);
    to.utilities.push(cellId);
  }
  slot.owner = toId;
  // 抵押状态保留（接收方继承）
}

export function validateTrade(state: GameState, offer: TradeOffer): TradeValidation {
  const giveCheck = validateSide(
    state,
    offer.fromId,
    offer.giveCash,
    offer.giveProperties,
    offer.giveJailCards
  );
  if (!giveCheck.ok) return giveCheck;

  const wantCheck = validateSide(
    state,
    offer.toId,
    offer.wantCash,
    offer.wantProperties,
    offer.wantJailCards
  );
  if (!wantCheck.ok) return wantCheck;

  return { ok: true };
}

// 原子执行交易（执行前应已通过 validateTrade）。
export function executeTrade(state: GameState, offer: TradeOffer): void {
  const from = state.getPlayer(offer.fromId)!;
  const to = state.getPlayer(offer.toId)!;

  // 现金
  from.cash -= offer.giveCash;
  to.cash += offer.giveCash;
  to.cash -= offer.wantCash;
  from.cash += offer.wantCash;

  // 出狱卡
  from.getOutOfJailCards -= offer.giveJailCards;
  to.getOutOfJailCards += offer.giveJailCards;
  to.getOutOfJailCards -= offer.wantJailCards;
  from.getOutOfJailCards += offer.wantJailCards;

  // 地产
  for (const cellId of offer.giveProperties) transferAsset(state, cellId, offer.fromId, offer.toId);
  for (const cellId of offer.wantProperties) transferAsset(state, cellId, offer.toId, offer.fromId);
}
