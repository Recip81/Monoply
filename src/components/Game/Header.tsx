import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import { Sound } from "@/utils/sound";

// 顶部信息栏：Logo + 房间号 + 回合数 + 当前玩家 + 静音开关
export default function Header() {
  const roomId = useSocketStore((s) => s.roomId);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const current = players[currentTurnIndex];

  const [muted, setMuted] = useState(Sound.isMuted());
  const toggleMute = () => {
    const m = Sound.toggleMute();
    setMuted(m);
    if (!m) Sound.play("click");
  };

  return (
    <header className="h-14 shrink-0 bg-surface shadow-card flex items-center px-5 gap-5 z-10">
      <div className="font-title text-xl text-accent">🎲 城市大富翁</div>
      <div className="text-sm text-txt-2">
        房间 <span className="font-num text-txt font-bold tracking-widest">{roomId}</span>
      </div>
      <div className="flex-1" />
      <div className="text-sm text-txt-2">
        回合 <span className="font-num text-txt font-bold">#{turnNumber}</span>
      </div>
      {current && (
        <div className="flex items-center gap-2 bg-bg rounded-full px-3 py-1">
          <span className="text-xl">{current.emoji}</span>
          <span className="font-body text-sm text-txt">{current.nickname}</span>
          <span className="text-xs text-txt-3">行动中</span>
        </div>
      )}
      <button
        onClick={toggleMute}
        title={muted ? "开启音效" : "静音"}
        className="ml-1 w-9 h-9 rounded-full bg-bg hover:bg-accent/10 flex items-center justify-center text-lg transition-colors"
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </header>
  );
}
