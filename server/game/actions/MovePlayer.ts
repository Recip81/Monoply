import type { GameState } from "../GameState.js";
import { Board } from "../Board.js";

export const START_BONUS = 200;
export const JAIL_CELL = 16; // 监狱/探访格（服刑格）
export const JAIL_VISIT_CELL = 16; // 同一格，路过的"探访"状态

export interface MoveResult {
  from: number;
  to: number;
  path: number[]; // 经过的每一格（不含起始格，含终点）
  passedStart: boolean;
}

// 前进 steps 格（steps 可为负，后退）。返回路径与是否经过起点。
// 后退不触发过起点奖励。
export function movePlayer(
  state: GameState,
  playerId: string,
  steps: number,
  collectStartBonus = true
): MoveResult {
  const player = state.getPlayer(playerId)!;
  const from = player.position;
  const count = Board.count;
  const path: number[] = [];
  let passedStart = false;

  if (steps >= 0) {
    for (let i = 1; i <= steps; i++) {
      const cell = (from + i) % count;
      path.push(cell);
      if (cell === 0 && i < steps) passedStart = true;
    }
    const to = (from + steps) % count;
    if (from + steps >= count) passedStart = true;
    player.position = to;
    if (passedStart && collectStartBonus) player.cash += START_BONUS;
    return { from, to, path, passedStart };
  } else {
    // 后退
    for (let i = 1; i <= -steps; i++) {
      const cell = (from - i + count) % count;
      path.push(cell);
    }
    const to = (from + steps + count) % count;
    player.position = to;
    return { from, to, path, passedStart: false };
  }
}

// 直接传送到目标格（车站传送/卡牌）。可选是否经过起点收钱。
export function teleportTo(
  state: GameState,
  playerId: string,
  to: number,
  passStart: boolean
): MoveResult {
  const player = state.getPlayer(playerId)!;
  const from = player.position;
  player.position = to;
  if (passStart) player.cash += START_BONUS;
  return { from, to, path: [to], passedStart: passStart };
}

// 送入监狱
export function sendToJail(state: GameState, playerId: string): void {
  const player = state.getPlayer(playerId)!;
  player.position = JAIL_CELL;
  player.inJail = true;
  player.jailTurns = 0;
  state.consecutiveDoubles = 0;
}
