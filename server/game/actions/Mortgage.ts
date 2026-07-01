import type { GameState } from "../GameState.js";
import { Board } from "../Board.js";

export interface MortgageResult {
  ok: boolean;
  reason?: string;
  cellId: number;
  amount?: number;
  mortgaged?: boolean;
}

function floor10(n: number): number {
  return Math.floor(n / 10) * 10;
}

// 地产面值：property/utility 用 cell.price；station 固定 200
function faceValue(cellId: number): number {
  const cell = Board.get(cellId);
  if (cell.type === "station") return Board.stationPrice;
  return cell.price ?? 0;
}

// 抵押：无房屋地产可抵押，获面值 50%。
export function mortgage(state: GameState, playerId: string, cellId: number): MortgageResult {
  const player = state.getPlayer(playerId)!;
  const slot = state.board[cellId];
  const cell = Board.get(cellId);

  const buyable =
    cell.type === "property" || cell.type === "station" || cell.type === "utility";
  if (!buyable) return { ok: false, reason: "该格子不可抵押", cellId };
  if (slot.owner !== playerId) return { ok: false, reason: "不是你的资产", cellId };
  if (slot.mortgaged) return { ok: false, reason: "已经抵押", cellId };
  if (slot.buildings > 0) return { ok: false, reason: "有建筑的地产不可抵押，请先卖房", cellId };

  const amount = floor10(faceValue(cellId) * 0.5);
  player.cash += amount;
  slot.mortgaged = true;
  return { ok: true, cellId, amount, mortgaged: true };
}

// 赎回：付抵押金额 + 10% 利息（取整到 ¥10）。
export function redeem(state: GameState, playerId: string, cellId: number): MortgageResult {
  const player = state.getPlayer(playerId)!;
  const slot = state.board[cellId];
  const cell = Board.get(cellId);

  const buyable =
    cell.type === "property" || cell.type === "station" || cell.type === "utility";
  if (!buyable) return { ok: false, reason: "该格子不可赎回", cellId };
  if (slot.owner !== playerId) return { ok: false, reason: "不是你的资产", cellId };
  if (!slot.mortgaged) return { ok: false, reason: "未处于抵押状态", cellId };

  const mortgageAmount = floor10(faceValue(cellId) * 0.5);
  const cost = floor10(mortgageAmount * 1.1);
  if (player.cash < cost) return { ok: false, reason: "现金不足，无法赎回", cellId, amount: cost };

  player.cash -= cost;
  slot.mortgaged = false;
  return { ok: true, cellId, amount: cost, mortgaged: false };
}
