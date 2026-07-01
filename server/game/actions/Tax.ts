import type { GameState } from "../GameState.js";
import { Board } from "../Board.js";

export interface TaxResult {
  cellId: number;
  amount: number;
  reason: string;
  detail?: string; // 计算明细（资产税用）
}

// 税务结算（落地即扣款）。按格子名称判断，避免随棋盘布局变动而漂移。
//   所得税：缴 ¥200
//   奢侈税：缴 ¥100
//   资产税：¥150 + 每持有 1 块地产 ¥10（含车站和公用事业），上限 ¥300
export function computeTax(state: GameState, playerId: string, cellId: number): TaxResult {
  const player = state.getPlayer(playerId)!;
  const name = Board.get(cellId).name;

  if (name === "所得税") {
    return { cellId, amount: 200, reason: "所得税" };
  }
  if (name === "奢侈税") {
    return { cellId, amount: 100, reason: "奢侈税" };
  }
  if (name === "资产税") {
    const holdings = player.allHoldings().length;
    const amount = Math.min(150 + holdings * 10, 300);
    return {
      cellId,
      amount,
      reason: "资产税",
      detail: `基础 ¥150 + 持有 ${holdings} 块 × ¥10 = ¥${150 + holdings * 10}${
        150 + holdings * 10 > 300 ? "（上限 ¥300）" : ""
      }`,
    };
  }
  return { cellId, amount: 0, reason: "" };
}

// 实际扣款（Phase 2 允许现金为负，破产由 Phase 3 处理）
export function payTax(state: GameState, playerId: string, amount: number): void {
  const player = state.getPlayer(playerId);
  if (player) player.cash -= amount;
}
