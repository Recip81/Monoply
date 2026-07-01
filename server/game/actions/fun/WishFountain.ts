import type { GameState } from "../../GameState.js";
import type { WishEffect } from "@shared/types";

// #25 许愿喷泉：三选一，可放弃。同时只能持 1 个，再次许愿覆盖。
//   A 财富之愿 ¥100：下次经过起点获 ¥500（替代 ¥200）
//   B 安宁之愿 ¥150：下次应付租金减半（取整到 ¥10）
//   C 幸运之愿 ¥80：下次掷骰可选 1 颗或 2 颗骰子
export const WISH_COST: Record<"A" | "B" | "C", number> = {
  A: 100,
  B: 150,
  C: 80,
};

export const WISH_TYPE: Record<"A" | "B" | "C", WishEffect["type"]> = {
  A: "wealth",
  B: "peace",
  C: "luck",
};

export interface WishResult {
  ok: boolean;
  reason?: string;
  cost?: number;
  wish?: WishEffect;
}

export function makeWish(
  state: GameState,
  playerId: string,
  option: "A" | "B" | "C"
): WishResult {
  const player = state.getPlayer(playerId);
  if (!player) return { ok: false, reason: "玩家不存在" };

  const cost = WISH_COST[option];
  if (player.cash < cost) return { ok: false, reason: "现金不足", cost };

  player.cash -= cost;
  const wish: WishEffect = { type: WISH_TYPE[option] };
  player.wish = wish; // 覆盖旧愿望
  return { ok: true, cost, wish };
}
