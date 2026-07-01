import { useState } from "react";
import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import StageInfoBar from "./StageInfoBar";

interface MarketOption {
  cellId: number;
  name: string;
  price: number;
}

// #33 黑市商人：A 黑市购房（面值80%）/ B 黑市套现（面值120%）/ 放弃。
export default function BlackMarketStage() {
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);

  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const isMyTurn = players[currentTurnIndex]?.id === myPlayerId;

  const [tab, setTab] = useState<"A" | "B">("A");

  const buyList: MarketOption[] =
    inputRequired?.type === "blackmarket_choose" ? inputRequired.options?.buyList ?? [] : [];
  const sellList: MarketOption[] =
    inputRequired?.type === "blackmarket_choose" ? inputRequired.options?.sellList ?? [] : [];

  const choose = (option: "A" | "B" | "skip", targetCellId?: number) =>
    emit("action", { type: "blackmarket_choose", payload: { option, targetCellId } });

  if (!isMyTurn) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-2">🎭</div>
        <h3 className="font-title text-2xl text-txt mb-1">黑市商人</h3>
        <div className="text-txt-3 text-sm animate-pulse mt-3">
          等待 {players[currentTurnIndex]?.nickname} 决定…
        </div>
      </div>
    );
  }

  const list = tab === "A" ? buyList : sellList;

  return (
    <div className="text-center">
      <div className="text-5xl mb-2">🎭</div>
      <h3 className="font-title text-2xl text-txt mb-3">黑市商人</h3>

      <div className="flex gap-2 mb-3 bg-bg rounded-2xl p-1">
        <button
          onClick={() => setTab("A")}
          className={`flex-1 py-2 rounded-xl font-title text-sm transition-colors ${
            tab === "A" ? "bg-accent text-white" : "text-txt-2"
          }`}
        >
          黑市购房 (80%)
        </button>
        <button
          onClick={() => setTab("B")}
          className={`flex-1 py-2 rounded-xl font-title text-sm transition-colors ${
            tab === "B" ? "bg-mint text-white" : "text-txt-2"
          }`}
        >
          黑市套现 (120%)
        </button>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1.5 mb-3">
        {list.length === 0 && (
          <div className="text-txt-3 text-sm py-6">
            {tab === "A" ? "没有可购买的地产" : "没有可套现的地产"}
          </div>
        )}
        {list.map((o) => (
          <button
            key={o.cellId}
            onClick={() => choose(tab, o.cellId)}
            className="w-full flex items-center justify-between bg-bg rounded-xl px-3 py-2 hover:bg-accent/10 transition-colors"
          >
            <span className="text-sm text-txt">{o.name}</span>
            <span className="font-num text-sm text-accent">¥{o.price}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => choose("skip")}
        className="w-full py-2.5 rounded-2xl bg-bg text-txt-2 font-title hover:bg-black/5 transition-colors"
      >
        放弃
      </button>

      <StageInfoBar
        what="黑市商人"
        who={`${players[currentTurnIndex]?.nickname ?? ""} 抉择`}
        outcome={tab === "A" ? "8 折购房" : "120% 套现"}
      />
    </div>
  );
}
