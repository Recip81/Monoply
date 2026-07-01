import type { GameState } from "../GameState.js";
import type { BuildingLevel } from "@shared/types";
import { Board } from "../Board.js";

export interface BuildResult {
  ok: boolean;
  reason?: string;
  cellId: number;
  level?: BuildingLevel;
  cost?: number;
  toHotel?: boolean; // 是否升级到酒店
}

// 升级一栋建筑（房屋或酒店）。
// 规则：自己回合踩到自己未抵押地产可升级一级；支付该组 buildCost；从全局 pool 扣除。
// 升到 5（酒店）时：归还 4 栋房屋到 housePool，从 hotelPool 扣 1。
export function buildHouse(state: GameState, playerId: string, cellId: number): BuildResult {
  const player = state.getPlayer(playerId)!;
  const slot = state.board[cellId];
  const meta = Board.getPropertyMeta(cellId);

  if (!meta) return { ok: false, reason: "该格子不是地产", cellId };
  if (slot.owner !== playerId) return { ok: false, reason: "不是你的地产", cellId };
  if (slot.mortgaged) return { ok: false, reason: "抵押中的地产不可建房", cellId };
  if (slot.buildings >= 5) return { ok: false, reason: "已是酒店，无法再升级", cellId };

  const cost = meta.buildCost;
  if (player.cash < cost) return { ok: false, reason: "现金不足", cellId, cost };

  const upgradingToHotel = slot.buildings === 4;
  if (upgradingToHotel) {
    // 升酒店：需要有酒店库存
    if (state.hotelPool <= 0) return { ok: false, reason: "酒店库存不足", cellId };
  } else {
    // 升房屋：需要有房屋库存
    if (state.housePool <= 0) return { ok: false, reason: "房屋库存不足", cellId };
  }

  // 执行
  player.cash -= cost;
  if (upgradingToHotel) {
    state.housePool += 4; // 4 栋房屋退回
    state.hotelPool -= 1;
  } else {
    state.housePool -= 1;
  }
  slot.buildings = (slot.buildings + 1) as BuildingLevel;

  return {
    ok: true,
    cellId,
    level: slot.buildings,
    cost,
    toHotel: upgradingToHotel,
  };
}
