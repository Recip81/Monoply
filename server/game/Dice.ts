export interface DiceRoll {
  dice: [number, number];
  total: number;
  isDouble: boolean;
}

export function rollDice(): DiceRoll {
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  return { dice: [a, b], total: a + b, isDouble: a === b };
}

export function rollOne(): number {
  return 1 + Math.floor(Math.random() * 6);
}
