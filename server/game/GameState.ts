import type { GameFullState, PropertyState, TurnPhase, TradeOffer } from "@shared/types";
import { Player } from "./Player.js";
import { Board } from "./Board.js";
import { CELL_COUNT } from "./data/mapData.js";
import { buildFateDeck, buildFundDeck } from "./CardDeck.js";

export const HOUSE_POOL_INIT = 48;
export const HOTEL_POOL_INIT = 16;

export class GameState {
  roomId: string;
  players: Player[];
  board: Record<number, PropertyState>;
  currentTurnIndex = 0;
  turnNumber = 1;
  phase: TurnPhase = "waiting";
  consecutiveDoubles = 0;
  housePool = HOUSE_POOL_INIT;
  hotelPool = HOTEL_POOL_INIT;
  fateDeck: number[] = [];
  fundDeck: number[] = [];
  fateIndex = 0;
  fundIndex = 0;
  lotteryPot = 0;
  pendingTrade: TradeOffer | null = null;

  constructor(roomId: string, players: Player[]) {
    this.roomId = roomId;
    this.players = players;
    this.board = {};
    for (let i = 0; i < CELL_COUNT; i++) {
      this.board[i] = { cellId: i, owner: null, buildings: 0, mortgaged: false };
    }
    // 初始化并洗好两副牌组
    this.fateDeck = buildFateDeck();
    this.fundDeck = buildFundDeck();
  }

  get currentPlayer(): Player {
    return this.players[this.currentTurnIndex];
  }

  getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  // 仍在局中（未破产）的玩家
  activePlayers(): Player[] {
    return this.players.filter((p) => !p.bankrupt);
  }

  // 推进到下一个未破产玩家
  nextTurn(): void {
    this.consecutiveDoubles = 0;
    const n = this.players.length;
    let idx = this.currentTurnIndex;
    for (let i = 0; i < n; i++) {
      idx = (idx + 1) % n;
      if (!this.players[idx].bankrupt) break;
    }
    // 回到或经过 0 号之前的玩家 → 回合数+1（粗略：每轮一圈+1）
    if (idx <= this.currentTurnIndex) this.turnNumber++;
    this.currentTurnIndex = idx;
  }

  // 判断是否只剩一名玩家（游戏结束）
  isGameOver(): boolean {
    return this.activePlayers().length <= 1;
  }

  winner(): Player | null {
    const active = this.activePlayers();
    return active.length === 1 ? active[0] : null;
  }

  // 某地产所属组玩家拥有的车站/公用事业计数辅助
  ownedStationCount(playerId: string): number {
    const p = this.getPlayer(playerId);
    return p ? p.stations.length : 0;
  }
  ownedUtilityCount(playerId: string): number {
    const p = this.getPlayer(playerId);
    return p ? p.utilities.length : 0;
  }

  toFullState(): GameFullState {
    return {
      roomId: this.roomId,
      players: this.players.map((p) => p.toState()),
      board: Object.fromEntries(
        Object.entries(this.board).map(([k, v]) => [k, { ...v }])
      ) as Record<number, PropertyState>,
      currentTurnIndex: this.currentTurnIndex,
      turnNumber: this.turnNumber,
      phase: this.phase,
      consecutiveDoubles: this.consecutiveDoubles,
      housePool: this.housePool,
      hotelPool: this.hotelPool,
      fateDeck: [...this.fateDeck],
      fundDeck: [...this.fundDeck],
      fateIndex: this.fateIndex,
      fundIndex: this.fundIndex,
      lotteryPot: this.lotteryPot,
      pendingTrade: this.pendingTrade,
    };
  }
}

// 工具：判断经过起点
export function passesStart(from: number, steps: number): boolean {
  return from + steps >= Board.count;
}
