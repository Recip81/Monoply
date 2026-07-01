import type { GameState } from "../../GameState.js";
import type { BuildingLevel } from "@shared/types";
import { Board } from "../../Board.js";

export interface DemolitionTarget {
  cellId: number;
  name: string;
  ownerId: string;
  ownerNick: string;
  buildings: BuildingLevel;
}

// 可拆迁目标：所有玩家有房屋（1~4，不含酒店 5）且未抵押的地产。
export function demolitionTargets(state: GameState): DemolitionTarget[] {
  const targets: DemolitionTarget[] = [];
  for (let cellId = 0; cellId < Board.count; cellId++) {
    const slot = state.board[cellId];
    if (!slot.owner) continue;
    if (slot.mortgaged) continue;
    if (slot.buildings < 1 || slot.buildings >= 5) continue; // 不可拆酒店
    const owner = state.getPlayer(slot.owner);
    targets.push({
      cellId,
      name: Board.get(cellId).name,
      ownerId: slot.owner,
      ownerNick: owner?.nickname ?? "",
      buildings: slot.buildings,
    });
  }
  return targets;
}

export interface DemolitionResult {
  ok: boolean;
  reason?: string;
  cellId: number;
  newLevel?: BuildingLevel;
  compensation?: number;
}

export const DEMOLITION_COMPENSATION = 50;

// 拆除某地产 1 栋房屋：等级 -1，房屋退回 housePool，拆迁者获 ¥50 补偿。
export function demolish(
  state: GameState,
  demolisherId: string,
  cellId: number
): DemolitionResult {
  const slot = state.board[cellId];
  if (!slot.owner) return { ok: false, reason: "该地产无主", cellId };
  if (slot.mortgaged) return { ok: false, reason: "抵押地产不可拆", cellId };
  if (slot.buildings < 1 || slot.buildings >= 5)
    return { ok: false, reason: "没有可拆的房屋（酒店不可拆）", cellId };

  slot.buildings = (slot.buildings - 1) as BuildingLevel;
  state.housePool += 1;

  const demolisher = state.getPlayer(demolisherId);
  if (demolisher) demolisher.cash += DEMOLITION_COMPENSATION;

  return {
    ok: true,
    cellId,
    newLevel: slot.buildings,
    compensation: DEMOLITION_COMPENSATION,
  };
}
