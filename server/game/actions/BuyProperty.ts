import type { GameState } from "../GameState.js";
import { Board } from "../Board.js";

export interface BuyResult {
  ok: boolean;
  reason?: string;
  cellId: number;
  price: number;
}

// 购买当前所站地产/车站/公用事业。Phase 1 支持 property/station/utility 三类。
export function buyProperty(state: GameState, playerId: string): BuyResult {
  const player = state.getPlayer(playerId)!;
  const cellId = player.position;
  const cell = Board.get(cellId);
  const slot = state.board[cellId];

  const isBuyable =
    cell.type === "property" || cell.type === "station" || cell.type === "utility";
  if (!isBuyable) {
    return { ok: false, reason: "该格子不可购买", cellId, price: 0 };
  }
  if (slot.owner !== null) {
    return { ok: false, reason: "该地产已有主", cellId, price: 0 };
  }

  // 价格：property/utility 用 cell.price；station 固定 200
  const price = cell.type === "station" ? Board.stationPrice : cell.price ?? 0;
  if (player.cash < price) {
    return { ok: false, reason: "现金不足", cellId, price };
  }

  player.cash -= price;
  slot.owner = playerId;
  if (cell.type === "property") player.properties.push(cellId);
  else if (cell.type === "station") player.stations.push(cellId);
  else if (cell.type === "utility") player.utilities.push(cellId);

  return { ok: true, cellId, price };
}
