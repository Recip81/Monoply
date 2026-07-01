import { useGameStore } from "@/stores/gameStore";

// 当前客户端对应的玩家状态
export function useMyPlayer() {
  const myId = useGameStore((s) => s.myPlayerId);
  const players = useGameStore((s) => s.players);
  return players.find((p) => p.id === myId) ?? null;
}

// 是否轮到我操作
export function useIsMyTurn() {
  const myId = useGameStore((s) => s.myPlayerId);
  const players = useGameStore((s) => s.players);
  const idx = useGameStore((s) => s.currentTurnIndex);
  return players[idx]?.id === myId;
}
