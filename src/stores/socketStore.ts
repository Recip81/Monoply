import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { STORAGE_KEY } from "@/utils/constants";
import type { PlayerInfo } from "@shared/types";

interface SessionData {
  roomId: string;
  playerId: string;
}

interface SocketStore {
  socket: Socket | null;
  connected: boolean;
  roomId: string | null;
  playerId: string | null;
  lobbyPlayers: PlayerInfo[];
  hostId: string | null;

  connect: () => Socket;
  disconnect: () => void;
  emit: (event: string, payload?: any) => void;
  setSession: (roomId: string, playerId: string) => void;
  setLobby: (players: PlayerInfo[], hostId: string) => void;
  loadSession: () => SessionData | null;
  clearSession: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,
  roomId: null,
  playerId: null,
  lobbyPlayers: [],
  hostId: null,

  connect: () => {
    const existing = get().socket;
    if (existing) return existing;

    // 开发环境下通过 Vite proxy 转发到后端，生产同源
    const socket = io({ autoConnect: true });

    socket.on("connect", () => {
      set({ connected: true });
      // 重连：若本地有会话标识，恢复内存状态并自动 rejoin
      const sess = get().loadSession();
      if (sess?.roomId && sess?.playerId) {
        set({ roomId: sess.roomId, playerId: sess.playerId });
        socket.emit("rejoin", { roomId: sess.roomId, playerId: sess.playerId });
      }
    });
    socket.on("disconnect", () => set({ connected: false }));

    set({ socket });
    return socket;
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },

  emit: (event, payload) => {
    get().socket?.emit(event, payload);
  },

  setSession: (roomId, playerId) => {
    set({ roomId, playerId });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, playerId }));
  },

  setLobby: (players, hostId) => set({ lobbyPlayers: players, hostId }),

  loadSession: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SessionData) : null;
    } catch {
      return null;
    }
  },

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ roomId: null, playerId: null, lobbyPlayers: [], hostId: null });
  },
}));
