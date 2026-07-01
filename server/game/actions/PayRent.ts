import type { GameState } from "../GameState.js";
import type { BuildingLevel } from "@shared/types";
import { Board } from "../Board.js";

export interface RentResult {
  due: boolean; // 是否需要缴租
  amount: number;
  fromId: string; // 缴租者
  toId: string | null; // 收租者（owner）
  cellId: number;
  reason: string;
}

// 计算地产租金（含房屋等级 + 整组垄断 base x2）
function propertyRent(state: GameState, cellId: number, ownerId: string): number {
  const meta = Board.getPropertyMeta(cellId);
  if (!meta) return 0;
  const slot = state.board[cellId];
  const rent = meta.rent;
  switch (slot.buildings as BuildingLevel) {
    case 1:
      return rent.house1;
    case 2:
      return rent.house2;
    case 3:
      return rent.house3;
    case 4:
      return rent.house4;
    case 5:
      return rent.hotel;
    case 0:
    default: {
      // 空地：若 owner 拥有整组，base x2
      const groupIds = Board.groupCells(meta.group);
      const ownsAll = groupIds.every((id) => state.board[id].owner === ownerId);
      return ownsAll ? rent.base * 2 : rent.base;
    }
  }
}

// 结算落地缴租。diceTotal 用于公用事业倍率计算。
export function computeRent(
  state: GameState,
  playerId: string,
  diceTotal: number
): RentResult {
  const player = state.getPlayer(playerId)!;
  const cellId = player.position;
  const cell = Board.get(cellId);
  const slot = state.board[cellId];

  const none: RentResult = {
    due: false,
    amount: 0,
    fromId: playerId,
    toId: null,
    cellId,
    reason: "",
  };

  const buyable =
    cell.type === "property" || cell.type === "station" || cell.type === "utility";
  if (!buyable) return none;
  if (slot.owner === null || slot.owner === playerId) return none;
  if (slot.mortgaged) return none; // 抵押期间不收租

  const owner = state.getPlayer(slot.owner);
  if (!owner || owner.bankrupt) return none;

  let amount = 0;
  let reason = "";
  if (cell.type === "property") {
    amount = propertyRent(state, cellId, owner.id);
    reason = "缴纳地产租金";
  } else if (cell.type === "station") {
    amount = Board.stationRent(owner.stations.length);
    reason = "缴纳车站租金";
  } else if (cell.type === "utility") {
    const mult = Board.utilityMultiplier(owner.utilities.length);
    amount = diceTotal * mult;
    reason = "缴纳公用事业费用";
  }

  return { due: amount > 0, amount, fromId: playerId, toId: owner.id, cellId, reason };
}

// 实际转账（Phase 1 不处理破产，现金可为负，由调用方后续处理）
export function applyRent(state: GameState, result: RentResult): void {
  if (!result.due || !result.toId) return;
  const from = state.getPlayer(result.fromId)!;
  const to = state.getPlayer(result.toId)!;
  from.cash -= result.amount;
  to.cash += result.amount;
}
