import type { GameState } from "../../GameState.js";
import { Board } from "../../Board.js";

function floor10(n: number): number {
  return Math.floor(n / 10) * 10;
}

function faceValue(cellId: number): number {
  const cell = Board.get(cellId);
  if (cell.type === "station") return Board.stationPrice;
  return cell.price ?? 0;
}

export interface BlackMarketBuyOption {
  cellId: number;
  name: string;
  price: number; // 面值 80%，取整到 ¥10
}

export interface BlackMarketSellOption {
  cellId: number;
  name: string;
  price: number; // 面值 120%，取整到 ¥10
}

// A 黑市购房：银行未售（无主）地产，以面值 80% 出售。
export function blackMarketBuyOptions(state: GameState): BlackMarketBuyOption[] {
  const opts: BlackMarketBuyOption[] = [];
  for (let cellId = 0; cellId < Board.count; cellId++) {
    const cell = Board.get(cellId);
    const buyable =
      cell.type === "property" || cell.type === "station" || cell.type === "utility";
    if (!buyable) continue;
    if (state.board[cellId].owner !== null) continue;
    opts.push({ cellId, name: cell.name, price: floor10(faceValue(cellId) * 0.8) });
  }
  return opts;
}

// B 黑市套现：自己无房屋、无抵押地产，以面值 120% 卖给银行。
export function blackMarketSellOptions(
  state: GameState,
  playerId: string
): BlackMarketSellOption[] {
  const player = state.getPlayer(playerId);
  if (!player) return [];
  const opts: BlackMarketSellOption[] = [];
  for (const cellId of player.allHoldings()) {
    const slot = state.board[cellId];
    if (slot.mortgaged) continue;
    if (slot.buildings > 0) continue;
    opts.push({
      cellId,
      name: Board.get(cellId).name,
      price: floor10(faceValue(cellId) * 1.2),
    });
  }
  return opts;
}

export interface BlackMarketResult {
  ok: boolean;
  reason?: string;
  cellId: number;
  price?: number;
  bought?: boolean; // true=购入, false=卖出
}

export function blackMarketBuy(
  state: GameState,
  playerId: string,
  cellId: number
): BlackMarketResult {
  const player = state.getPlayer(playerId)!;
  const cell = Board.get(cellId);
  const slot = state.board[cellId];
  const buyable =
    cell.type === "property" || cell.type === "station" || cell.type === "utility";
  if (!buyable) return { ok: false, reason: "不可购买", cellId };
  if (slot.owner !== null) return { ok: false, reason: "该地产已有主", cellId };

  const price = floor10(faceValue(cellId) * 0.8);
  if (player.cash < price) return { ok: false, reason: "现金不足", cellId, price };

  player.cash -= price;
  slot.owner = playerId;
  if (cell.type === "property") player.properties.push(cellId);
  else if (cell.type === "station") player.stations.push(cellId);
  else if (cell.type === "utility") player.utilities.push(cellId);

  return { ok: true, cellId, price, bought: true };
}

export function blackMarketSell(
  state: GameState,
  playerId: string,
  cellId: number
): BlackMarketResult {
  const player = state.getPlayer(playerId)!;
  const cell = Board.get(cellId);
  const slot = state.board[cellId];
  if (slot.owner !== playerId) return { ok: false, reason: "不是你的资产", cellId };
  if (slot.mortgaged) return { ok: false, reason: "抵押地产不可套现", cellId };
  if (slot.buildings > 0) return { ok: false, reason: "有建筑的地产不可套现", cellId };

  const price = floor10(faceValue(cellId) * 1.2);
  player.cash += price;
  slot.owner = null;
  if (cell.type === "property")
    player.properties = player.properties.filter((c) => c !== cellId);
  else if (cell.type === "station")
    player.stations = player.stations.filter((c) => c !== cellId);
  else if (cell.type === "utility")
    player.utilities = player.utilities.filter((c) => c !== cellId);

  return { ok: true, cellId, price, bought: false };
}
