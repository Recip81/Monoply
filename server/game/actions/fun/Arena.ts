import { rollOne } from "../../Dice.js";

// #16 擂台挑战：双方各掷 1 颗骰子，点数大者赢，输家付赢家 ¥150；平局无人支付。
export interface ArenaOutcome {
  challengerRoll: number;
  opponentRoll: number;
  winnerId: string | null; // null = 平局
  loserId: string | null;
  amount: number; // 150 或 0
}

export const ARENA_STAKE = 150;

export function fightArena(challengerId: string, opponentId: string): ArenaOutcome {
  const a = rollOne();
  const b = rollOne();
  if (a === b) {
    return { challengerRoll: a, opponentRoll: b, winnerId: null, loserId: null, amount: 0 };
  }
  if (a > b) {
    return { challengerRoll: a, opponentRoll: b, winnerId: challengerId, loserId: opponentId, amount: ARENA_STAKE };
  }
  return { challengerRoll: a, opponentRoll: b, winnerId: opponentId, loserId: challengerId, amount: ARENA_STAKE };
}
