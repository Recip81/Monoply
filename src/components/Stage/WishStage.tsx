import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import StageInfoBar from "./StageInfoBar";

// #25 许愿喷泉：A 财富(¥100)/B 安宁(¥150)/C 幸运(¥80)，可放弃。
const WISHES = [
  { key: "A", emoji: "💰", title: "财富之愿", cost: 100, desc: "下次经过起点获 ¥500" },
  { key: "B", emoji: "🕊️", title: "安宁之愿", cost: 150, desc: "下次应付租金减半" },
  { key: "C", emoji: "🍀", title: "幸运之愿", cost: 80, desc: "下次掷骰可选 1 或 2 颗" },
] as const;

export default function WishStage() {
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);

  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const current = players[currentTurnIndex];
  const isMyTurn = current?.id === myPlayerId;

  const opts = inputRequired?.type === "wish_choose" ? inputRequired.options : null;
  const act = (option: string) =>
    emit("action", { type: "wish_choose", payload: { option } });

  return (
    <div className="text-center">
      <div className="text-5xl mb-2 animate-[bob_2s_ease-in-out_infinite]">⛲</div>
      <h3 className="font-title text-2xl text-txt mb-1">许愿喷泉</h3>

      {opts && isMyTurn ? (
        <>
          <p className="text-xs text-txt-3 mb-4">投币许愿（同时只能持 1 个）</p>
          <div className="space-y-2">
            {WISHES.map((w) => {
              const canAfford: boolean = opts[w.key]?.canAfford ?? false;
              return (
                <button
                  key={w.key}
                  disabled={!canAfford}
                  onClick={() => act(w.key)}
                  className="w-full flex items-center gap-3 bg-bg rounded-2xl px-4 py-3 hover:bg-accent/10 disabled:opacity-40 transition-colors text-left"
                >
                  <span className="text-2xl">{w.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-title text-txt">{w.title}</div>
                    <div className="text-xs text-txt-3">{w.desc}</div>
                  </div>
                  <span className="font-num text-accent">¥{w.cost}</span>
                </button>
              );
            })}
            <button
              onClick={() => act("skip")}
              className="w-full py-2.5 rounded-2xl bg-surface text-txt-3 font-title hover:bg-black/5 transition-colors"
            >
              放弃
            </button>
          </div>
          <StageInfoBar
            what="许愿喷泉"
            who={`${current?.nickname ?? ""} 抉择`}
            outcome="投币许愿 或 放弃"
          />
        </>
      ) : (
        <div className="text-txt-3 text-sm animate-pulse py-4">
          等待 {current?.nickname} 许愿…
        </div>
      )}
    </div>
  );
}
