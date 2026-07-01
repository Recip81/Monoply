import type { FateCard, FundCard } from "@shared/types";
import { fateCards, fateCardMap } from "./data/fateCards.js";
import { fundCards, fundCardMap } from "./data/fundCards.js";

// Fisher–Yates 洗牌（原地）
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 按 copies 展开成 id 序列
function expand(cards: { id: number; copies: number }[]): number[] {
  const ids: number[] = [];
  for (const c of cards) {
    for (let i = 0; i < c.copies; i++) ids.push(c.id);
  }
  return ids;
}

export function buildFateDeck(): number[] {
  return shuffle(expand(fateCards));
}

export function buildFundDeck(): number[] {
  return shuffle(expand(fundCards));
}

// 抽一张牌：返回卡定义，并推进指针；用完则重洗。
// 返回新的 deck/index 由调用方写回 state。
export interface DrawOutcome<T> {
  card: T;
  deck: number[];
  index: number;
}

export function drawFate(deck: number[], index: number): DrawOutcome<FateCard> {
  let d = deck;
  let i = index;
  if (i >= d.length) {
    d = buildFateDeck();
    i = 0;
  }
  const cardId = d[i];
  const card = fateCardMap.get(cardId)!;
  return { card, deck: d, index: i + 1 };
}

export function drawFund(deck: number[], index: number): DrawOutcome<FundCard> {
  let d = deck;
  let i = index;
  if (i >= d.length) {
    d = buildFundDeck();
    i = 0;
  }
  const cardId = d[i];
  const card = fundCardMap.get(cardId)!;
  return { card, deck: d, index: i + 1 };
}
