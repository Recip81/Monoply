import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import { useEffect, useState } from "react";
import RollingDie from "./RollingDie";
import StageInfoBar from "./StageInfoBar";

// #42 社区彩票：全员投注 → 玩家点「开奖」→ 掷骰 → 按规则分配奖池。
// outcome 由 player_acted(lottery) 合并。
// 分配：双骰→独得全池 / 7→得¥200余均分 / 其他→得¥100余随机分2人
export default function LotteryStage() {
  const content = useUiStore((s) => s.stageContent);
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const current = players[currentTurnIndex];
  const isMyTurn = current?.id === myPlayerId;

  const [clicked, setClicked] = useState(false);
  // 结果文字在骰子滚完后再显示（RollingDie 约 0.8s）
  const [showResult, setShowResult] = useState(false);

  const outcome = content?.outcome; // LotteryResult（点击后立即回来）
  const nameOf = (id: string) => players.find((p) => p.id === id)?.nickname ?? "";
  const emojiOf = (id: string) => players.find((p) => p.id === id)?.emoji ?? "";

  const funWaiting = inputRequired?.type === "fun_trigger" && inputRequired.options?.funType === "lottery";
  const showBtn = funWaiting && isMyTurn && !clicked;

  const doClick = () => {
    setClicked(true);
    emit("action", { type: "fun_start", payload: { funType: "lottery" } });
  };

  // outcome 一到骰子立刻滚，分配文字延迟 1s 后再显示
  useEffect(() => {
    if (outcome) {
      setShowResult(false);
      const id = setTimeout(() => setShowResult(true), 1000);
      return () => clearTimeout(id);
    }
  }, [outcome?.dice?.[0], outcome?.dice?.[1]]);

  return (
    <div className="text-center">
      <div className="text-5xl mb-2">🎰</div>
      <h3 className="font-title text-2xl text-txt mb-1">社区彩票开奖！</h3>
      <p className="text-xs text-txt-3 mb-4">全员各投 ¥50，掷骰定分配</p>

      {showBtn ? (
        <button
          onClick={doClick}
          className="w-full py-3 rounded-2xl bg-accent text-white font-title text-lg shadow-card hover:bg-accent-d transition-colors"
        >
          开奖
        </button>
      ) : outcome ? (
        <div className="space-y-3">
          <div className="flex justify-center gap-3">
            {outcome.dice.map((d: number, i: number) => (
              <RollingDie key={`d${i}-${d}`} value={d} size={48} />
            ))}
          </div>
          <div className="text-sm text-txt-2">
            奖池合计 <span className="font-num text-accent font-bold">¥{outcome.potBefore}</span>
            <span className="ml-2 text-txt-3">点数 {outcome.dice[0] + outcome.dice[1]}</span>
          </div>
          {showResult ? (
            <div className="bg-bg rounded-2xl py-2 px-4 space-y-1 max-h-40 overflow-y-auto">
              {outcome.payouts.length === 0 ? (
                <div className="text-txt-3 text-sm">无人中奖</div>
              ) : (
              outcome.payouts.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-txt-2">
                    {emojiOf(p.playerId)} {nameOf(p.playerId)}
                  </span>
                  <span className="font-num text-c-green">+¥{p.amount}</span>
                </div>
              ))
            )}
          </div>
          ) : (
            <div className="text-txt-3 text-sm animate-pulse py-2">骰子滚动中…</div>
          )}
          <StageInfoBar
            what="社区彩票"
            who="全员投注 ¥50"
            outcome={
              showResult
                ? (outcome.payouts.length > 0
                    ? `${nameOf(outcome.payouts[0].playerId)} 得 ¥${outcome.payouts[0].amount}`
                    : "无人中奖")
                : "待揭晓"
            }
          />
        </div>
      ) : (
        <div className="text-txt-3 text-sm animate-pulse py-4">{isMyTurn ? "准备开奖…" : `等待 ${current?.nickname} 开奖…`}</div>
      )}
    </div>
  );
}
