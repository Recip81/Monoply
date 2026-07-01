import type { PlayerState, WishEffect } from "@shared/types";

export const STARTING_CASH = 1800;

export class Player implements PlayerState {
  id: string;
  nickname: string;
  emoji: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
  properties: number[];
  stations: number[];
  utilities: number[];
  getOutOfJailCards: number;
  wish: WishEffect | null;
  freeRentCard: boolean;
  connected: boolean;

  constructor(id: string, nickname: string, emoji: string) {
    this.id = id;
    this.nickname = nickname;
    this.emoji = emoji;
    this.cash = STARTING_CASH;
    this.position = 0;
    this.inJail = false;
    this.jailTurns = 0;
    this.bankrupt = false;
    this.properties = [];
    this.stations = [];
    this.utilities = [];
    this.getOutOfJailCards = 0;
    this.wish = null;
    this.freeRentCard = false;
    this.connected = true;
  }

  // 拥有的所有可产生租金/资产的 cellId（地产+车站+公用事业）
  allHoldings(): number[] {
    return [...this.properties, ...this.stations, ...this.utilities];
  }

  toState(): PlayerState {
    return {
      id: this.id,
      nickname: this.nickname,
      emoji: this.emoji,
      cash: this.cash,
      position: this.position,
      inJail: this.inJail,
      jailTurns: this.jailTurns,
      bankrupt: this.bankrupt,
      properties: [...this.properties],
      stations: [...this.stations],
      utilities: [...this.utilities],
      getOutOfJailCards: this.getOutOfJailCards,
      wish: this.wish ? { ...this.wish } : null,
      freeRentCard: this.freeRentCard,
      connected: this.connected,
    };
  }
}
