import type { GameState } from "../GameState.js";
import type { BuildingLevel } from "@shared/types";
import { Board } from "../Board.js";

export interface SellResult {
  ok: boolean;
  reason?: string;
  cellId: number;
  level?: BuildingLevel;
  refund?: number;
  fromHotel?: boolean;
}

// 取整到 ¥10（向下）
function floor10(n: number): number {
  return Math.floor(n / 10) * 10;
}

// 卖一栋建筑（降一级）。回收建造成本的 50%，向下取整到 ¥10。
// 房屋退回 housePool，酒店退回 hotelPool（酒店降级时需要 4 栋房屋库存换回）。
export function sellHouse(state: GameState, playerId: string, cellId: number): SellResult {
  const player = state.getPlayer(playerId)!;
  const slot = state.board[cellId];
  const meta = Board.getPropertyMeta(cellId);

  if (!meta) return { ok: false, reason: "该格子不是地产", cellId };
  if (slot.owner !== playerId) return { ok: false, reason: "不是你的地产", cellId };
  if (slot.buildings <= 0) return { ok: false, reason: "没有可出售的建筑", cellId };

  const fromHotel = slot.buildings === 5;
  if (fromHotel) {
    // 酒店降回 4 栋房屋：需要房屋库存 >= 4
    if (state.housePool < 4) return { ok: false, reason: "房屋库存不足，无法拆解酒店", cellId };
  }

  const refund = floor10(meta.buildCost * 0.5);
  player.cash += refund;

  if (fromHotel) {
    state.hotelPool += 1;
    state.housePool -= 4;
  } else {
    state.housePool += 1;
  }
  slot.buildings = (slot.buildings - 1) as BuildingLevel;

  return { ok: true, cellId, level: slot.buildings, refund, fromHotel };
}
