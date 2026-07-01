import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import StageInfoBar from "./StageInfoBar";

interface Target {
  cellId: number;
  name: string;
  ownerId: string;
  ownerNick: string;
  buildings: number;
}

// #50 拆迁办：选择 1 栋房屋拆除（任何人的，不含酒店/抵押），获 ¥50 补偿，可放弃。
export default function DemolitionStage() {
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);

  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const isMyTurn = players[currentTurnIndex]?.id === myPlayerId;

  const targets: Target[] =
    inputRequired?.type === "demolish_choose" ? inputRequired.options?.targets ?? [] : [];

  const choose = (cellId: number | null) =>
    emit("action", { type: "demolish_choose", payload: { cellId } });

  return (
    <div className="text-center">
      <div className="text-5xl mb-2">🏗️</div>
      <h3 className="font-title text-2xl text-txt mb-3">拆迁办</h3>

      {!isMyTurn ? (
        <div className="text-txt-3 text-sm animate-pulse mt-3">
          等待 {players[currentTurnIndex]?.nickname} 决定…
        </div>
      ) : (
        <>
          <p className="text-xs text-txt-3 mb-3">选择拆除 1 栋房屋，获 ¥50 补偿</p>
          <div className="max-h-52 overflow-y-auto space-y-1.5 mb-3">
            {targets.length === 0 && (
              <div className="text-txt-3 text-sm py-6">没有可拆迁的目标</div>
            )}
            {targets.map((t) => (
              <button
                key={t.cellId}
                onClick={() => choose(t.cellId)}
                className="w-full flex items-center justify-between bg-bg rounded-xl px-3 py-2 hover:bg-accent/10 transition-colors"
              >
                <span className="text-sm text-txt">{t.name}</span>
                <span className="text-xs text-txt-2">
                  {t.ownerNick} · 🏠 {t.buildings}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => choose(null)}
            className="w-full py-2.5 rounded-2xl bg-bg text-txt-2 font-title hover:bg-black/5 transition-colors"
          >
            放弃
          </button>
          <StageInfoBar
            what="拆迁办"
            who={`${players[currentTurnIndex]?.nickname ?? ""} 抉择`}
            outcome="拆 1 栋房屋得 ¥50"
          />
        </>
      )}
    </div>
  );
}
