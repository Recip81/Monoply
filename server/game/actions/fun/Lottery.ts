import type { GameState } from "../../GameState.js";
import { rollDice } from "../../Dice.js";

export interface LotteryContribution {
  playerId: string;
  amount: number; // 投入（50 或 0）
}

export interface LotteryPayout {
  playerId: string;
  amount: number;
}

export interface LotteryResult {
  contributions: LotteryContribution[];
  dice: [number, number];
  total: number;
  isDouble: boolean;
  payouts: LotteryPayout[];
  potBefore: number;
  potAfter: number; // 结算后奖池（应为 0）
}

// 社区彩票：所有玩家强制参与。
// 1. 每人投 ¥50（现金不足者免投、不参与分配）
// 2. 踩到者掷 2 骰
// 3. 双骰→踩到者独得；点数7→踩到者¥200余下平分其他玩家；其他→踩到者¥100余下随机分2名其他玩家
export function runLottery(state: GameState, standerId: string): LotteryResult {
  const active = state.players.filter((p) => !p.bankrupt);

  // 1. 投入奖池
  const contributions: LotteryContribution[] = [];
  for (const p of active) {
    if (p.cash >= 50) {
      p.cash -= 50;
      state.lotteryPot += 50;
      contributions.push({ playerId: p.id, amount: 50 });
    } else {
      contributions.push({ playerId: p.id, amount: 0 });
    }
  }

  // 参与分配的其他玩家（投了钱的、非踩到者）
  const participatedOthers = contributions
    .filter((c) => c.amount > 0 && c.playerId !== standerId)
    .map((c) => c.playerId);

  // 2. 掷骰
  const roll = rollDice();
  const potBefore = state.lotteryPot;
  const payouts: LotteryPayout[] = [];

  const give = (playerId: string, amount: number) => {
    if (amount <= 0) return;
    const pl = state.getPlayer(playerId);
    if (!pl) return;
    pl.cash += amount;
    payouts.push({ playerId, amount });
  };

  // 3. 结算
  if (roll.isDouble) {
    // 踩到者独得全部
    give(standerId, potBefore);
  } else if (roll.total === 7) {
    const standerGets = Math.min(200, potBefore);
    give(standerId, standerGets);
    const rest = potBefore - standerGets;
    if (rest > 0 && participatedOthers.length > 0) {
      const each = Math.floor(rest / participatedOthers.length / 10) * 10;
      let distributed = 0;
      for (const id of participatedOthers) {
        give(id, each);
        distributed += each;
      }
      // 余数补给踩到者
      const remainder = rest - distributed;
      if (remainder > 0) give(standerId, remainder);
    } else if (rest > 0) {
      give(standerId, rest);
    }
  } else {
    const standerGets = Math.min(100, potBefore);
    give(standerId, standerGets);
    const rest = potBefore - standerGets;
    if (rest > 0 && participatedOthers.length > 0) {
      // 随机分给 2 名其他玩家各一半
      const shuffled = [...participatedOthers].sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, 2);
      const half = Math.floor(rest / winners.length / 10) * 10;
      let distributed = 0;
      for (const id of winners) {
        give(id, half);
        distributed += half;
      }
      const remainder = rest - distributed;
      if (remainder > 0) give(standerId, remainder);
    } else if (rest > 0) {
      give(standerId, rest);
    }
  }

  // 奖池清空
  state.lotteryPot = 0;

  return {
    contributions,
    dice: roll.dice,
    total: roll.total,
    isDouble: roll.isDouble,
    payouts,
    potBefore,
    potAfter: 0,
  };
}
