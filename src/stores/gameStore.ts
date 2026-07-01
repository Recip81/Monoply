import { create } from "zustand";
import type {
  GameFullState,
  PlayerState,
  PropertyState,
  TurnPhase,
  TradeOffer,
} from "@shared/types";

interface GameStore {
  myPlayerId: string | null;
  players: PlayerState[];
  board: Record<number, PropertyState>;
  currentTurnIndex: number;
  turnNumber: number;
  phase: TurnPhase;
  consecutiveDoubles: number;
  housePool: number;
  hotelPool: number;
  lotteryPot: number;
  pendingTrade: TradeOffer | null;
  started: boolean;

  setMyPlayerId: (id: string) => void;
  syncState: (state: GameFullState) => void;
  updatePlayer: (id: string, partial: Partial<PlayerState>) => void;
  updateCell: (cellId: number, partial: Partial<PropertyState>) => void;
  setPhase: (phase: TurnPhase) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  myPlayerId: null,
  players: [],
  board: {},
  currentTurnIndex: 0,
  turnNumber: 1,
  phase: "waiting",
  consecutiveDoubles: 0,
  housePool: 48,
  hotelPool: 16,
  lotteryPot: 0,
  pendingTrade: null,
  started: false,

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  syncState: (s) =>
    set({
      players: s.players,
      board: s.board,
      currentTurnIndex: s.currentTurnIndex,
      turnNumber: s.turnNumber,
      phase: s.phase,
      consecutiveDoubles: s.consecutiveDoubles,
      housePool: s.housePool,
      hotelPool: s.hotelPool,
      lotteryPot: s.lotteryPot,
      pendingTrade: s.pendingTrade,
      started: true,
    }),

  updatePlayer: (id, partial) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, ...partial } : p
      ),
    })),

  updateCell: (cellId, partial) =>
    set((state) => ({
      board: {
        ...state.board,
        [cellId]: { ...state.board[cellId], ...partial },
      },
    })),

  setPhase: (phase) => set({ phase }),

  reset: () =>
    set({
      players: [],
      board: {},
      currentTurnIndex: 0,
      turnNumber: 1,
      phase: "waiting",
      consecutiveDoubles: 0,
      started: false,
    }),
}));
