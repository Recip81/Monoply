import { useGameStore } from "@/stores/gameStore";
import PlayerCard from "./PlayerCard";
import ActionBar from "./ActionBar";
import EventLog from "./EventLog";

// 右侧栏：玩家卡片列表 + 操作面板 + 游戏记录
export default function Sidebar() {
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  return (
    <aside className="w-full lg:w-[300px] shrink-0 h-[40%] lg:h-full flex flex-col gap-3 p-3 bg-bg/60 overflow-hidden">
      {/* 玩家卡片：小屏横向滚动；大屏纵向，限高可滚，不挤压下方 */}
      <div className="shrink-0 flex gap-2 overflow-x-auto lg:block lg:space-y-2 lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[45%] pr-1">
        {players.map((p, i) => (
          <div key={p.id} className="shrink-0 w-44 lg:w-auto">
            <PlayerCard
              player={p}
              index={i}
              isCurrent={i === currentTurnIndex}
              isMe={p.id === myPlayerId}
            />
          </div>
        ))}
      </div>

      <div className="shrink-0">
        <ActionBar />
      </div>
      {/* 游戏记录：占据剩余空间并内部滚动 */}
      <div className="hidden lg:flex flex-1 min-h-0">
        <EventLog />
      </div>
    </aside>
  );
}
