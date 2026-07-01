import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";

// 底部操作面板：自由操作阶段按钮（建房/抵押管理在 Phase 2 开放；交易在 Phase 3）
export default function ActionBar() {
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const phase = useGameStore((s) => s.phase);
  const emit = useSocketStore((s) => s.emit);
  const inputRequired = useUiStore((s) => s.inputRequired);
  const openManage = useUiStore((s) => s.openManage);
  const openTrade = useUiStore((s) => s.openTrade);

  const isMyTurn = players[currentTurnIndex]?.id === myPlayerId;
  const canEndTurn = isMyTurn && phase === "free_action";

  const act = (type: string, payload?: any) => emit("action", { type, payload });

  return (
    <div className="bg-surface rounded-2xl shadow-card p-3">
      <div className="text-xs text-txt-3 mb-2 text-center">
        {isMyTurn ? "你的回合" : `${players[currentTurnIndex]?.nickname ?? ""} 行动中`}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ActBtn
          label="🏠 建房/管理"
          onClick={openManage}
        />
        <ActBtn
          label="🤝 交易"
          disabled={!isMyTurn}
          title={isMyTurn ? "发起交易" : "仅自己回合可发起"}
          onClick={() => openTrade(null)}
        />
        <ActBtn
          label="🏦 抵押管理"
          onClick={openManage}
        />
        <ActBtn
          label="✅ 结束回合"
          accent
          disabled={!canEndTurn}
          onClick={() => act("end_turn")}
        />
      </div>
      {inputRequired && inputRequired.type !== "free_action" && (
        <div className="text-xs text-accent text-center mt-2 animate-pulse">
          等待操作：{inputRequired.type}
        </div>
      )}
    </div>
  );
}

function ActBtn({
  label,
  onClick,
  disabled,
  accent,
  title,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`py-2.5 rounded-xl font-title text-sm transition-all disabled:opacity-30 ${
        accent
          ? "bg-accent text-white shadow-card hover:bg-accent-d"
          : "bg-bg text-txt-2 hover:bg-accent/10"
      }`}
    >
      {label}
    </button>
  );
}
