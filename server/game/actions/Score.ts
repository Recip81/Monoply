import type { GameState } from "../GameState.js";
import { Board } from "../Board.js";

export interface PlayerScore {
  playerId: string;
  nickname: string;
  emoji: string;
  bankrupt: boolean;
  score: number;
  breakdown: {
    cash: number;
    propertyValue: number;
    houses: number;
    hotels: number;
    mortgaged: number;
    jailCards: number;
    wish: number;
  };
}

// 地产/车站/公用事业面值（station 固定 200）
function faceValue(cellId: number): number {
  const cell = Board.get(cellId);
  if (cell.type === "station") return Board.stationPrice;
  return cell.price ?? 0;
}

// 计分公式（设计文档第二十二部分）：
//   得分 = 现金÷10 + 地产面值÷10 + 每栋房×5 + 每家酒店×20
//        + 抵押地产面值÷20 + 出狱卡每张×3 + 许愿效果×2
export function computeScore(state: GameState, playerId: string): PlayerScore {
  const p = state.getPlayer(playerId)!;
  const holdings = [...p.properties, ...p.stations, ...p.utilities];

  let propertyValue = 0;
  let mortgaged = 0;
  let houses = 0;
  let hotels = 0;

  for (const cellId of holdings) {
    const slot = state.board[cellId];
    const face = faceValue(cellId);
    if (slot.mortgaged) {
      mortgaged += face / 20;
    } else {
      propertyValue += face / 10;
    }
    if (slot.buildings === 5) {
      hotels += 1;
    } else if (slot.buildings >= 1) {
      houses += slot.buildings;
    }
  }

  const breakdown = {
    cash: p.cash / 10,
    propertyValue,
    houses: houses * 5,
    hotels: hotels * 20,
    mortgaged,
    jailCards: p.getOutOfJailCards * 3,
    wish: p.wish ? 2 : 0,
  };

  const score = Math.round(
    breakdown.cash +
      breakdown.propertyValue +
      breakdown.houses +
      breakdown.hotels +
      breakdown.mortgaged +
      breakdown.jailCards +
      breakdown.wish
  );

  return {
    playerId: p.id,
    nickname: p.nickname,
    emoji: p.emoji,
    bankrupt: p.bankrupt,
    score,
    breakdown,
  };
}

// 所有玩家得分，按分数降序。
export function computeScores(state: GameState): PlayerScore[] {
  return state.players
    .map((p) => computeScore(state, p.id))
    .sort((a, b) => b.score - a.score);
}

// 最高分玩家 id（破产者也计入排名，但通常分低）。
export function topScorerId(state: GameState): string | null {
  const scores = computeScores(state);
  return scores.length > 0 ? scores[0].playerId : null;
}
