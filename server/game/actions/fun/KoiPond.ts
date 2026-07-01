import type { GameState } from "../../GameState.js";
import { rollDice } from "../../Dice.js";

// #58 锦鲤池：掷 2 颗骰子对照奖励。
//   双6: ¥1000 / 其他双骰: ¥500 / 7点: ¥300 / 6或8: ¥100 / 其他: ¥0
export interface KoiOutcome {
  dice: [number, number];
  total: number;
  reward: number;
  tier: string;
}

export function koiReward(): KoiOutcome {
  const roll = rollDice();
  const [a, b] = roll.dice;
  const total = roll.total;
  let reward = 0;
  let tier = "无奖励";

  if (a === 6 && b === 6) {
    reward = 1000;
    tier = "双6 锦鲤附体";
  } else if (a === b) {
    reward = 500;
    tier = "双骰好运";
  } else if (total === 7) {
    reward = 300;
    tier = "幸运7";
  } else if (total === 6 || total === 8) {
    reward = 100;
    tier = "小确幸";
  }

  return { dice: roll.dice, total, reward, tier };
}

export function applyKoi(state: GameState, playerId: string, reward: number): void {
  const p = state.getPlayer(playerId);
  if (p) p.cash += reward;
}
