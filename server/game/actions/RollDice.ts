import type { GameState } from "../GameState.js";
import { rollDice, type DiceRoll } from "../Dice.js";

export interface RollResult {
  roll: DiceRoll;
  consecutiveDoubles: number;
  goToJail: boolean; // 连续第三次双骰
}

// 执行掷骰，更新连续双骰计数。第三次双骰 → 入狱。
export function performRoll(state: GameState): RollResult {
  const roll = rollDice();
  if (roll.isDouble) {
    state.consecutiveDoubles += 1;
  } else {
    state.consecutiveDoubles = 0;
  }
  const goToJail = roll.isDouble && state.consecutiveDoubles >= 3;
  return { roll, consecutiveDoubles: state.consecutiveDoubles, goToJail };
}
