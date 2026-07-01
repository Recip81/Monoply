import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import { useEffect, useState } from "react";
import RollingDie from "./RollingDie";
import StageInfoBar from "./StageInfoBar";

// #58 锦鲤池：玩家点「掷骰博运气」后服务端结算并返回结果。
// 奖励表：双6→¥1000 / 双骰(非双6)→¥500 / 7→¥300 / 6或8→¥100 / 其他→¥0
export default function KoiStage() {
  const content = useUiStore((s) => s.stageContent);
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const current = players[currentTurnIndex];
  const isMyTurn = current?.id === myPlayerId;

  const [clicked, setClicked] = useState(false);
  // 结果文字在骰子滚完后再显示（RollingDie 约 0.8s），避免提前泄露
  const [showResult, setShowResult] = useState(false);

  const outcome = content?.outcome; // { dice, total, reward, tier }（点击后立即回来）
  const reward: number = outcome?.reward ?? 0;
  const bigWin = reward >= 500;
  const funWaiting = inputRequired?.type === "fun_trigger" && inputRequired.options?.funType === "koi_pond";
  const showBtn = funWaiting && isMyTurn && !clicked;

  const doClick = () => {
    setClicked(true);
    emit("action", { type: "fun_start", payload: { funType: "koi_pond" } });
  };

  // outcome 一到骰子立刻滚，奖励文字延迟 1s 后再显示
  useEffect(() => {
    if (outcome) {
      setShowResult(false);
      const id = setTimeout(() => setShowResult(true), 1000);
      return () => clearTimeout(id);
    }
  }, [outcome?.reward, outcome?.tier]);

  return (
    <div className="text-center relative overflow-hidden">
      {outcome && bigWin && <CoinRain />}

      <div className="text-5xl mb-2">🐟</div>
      <h3 className="font-title text-2xl text-txt mb-1">锦鲤池</h3>
      <p className="text-xs text-txt-3 mb-4">~~水波荡漾~~ {current?.nickname} 的好运时刻</p>

      {showBtn ? (
        <button
          onClick={doClick}
          className="w-full py-3 rounded-2xl bg-accent text-white font-title text-lg shadow-card hover:bg-accent-d transition-colors"
        >
          掷骰博运气
        </button>
      ) : outcome ? (
        <>
          <div className="flex justify-center gap-3 mb-4">
            {outcome.dice.map((d: number, i: number) => (
              <RollingDie key={`${i}-${d}`} value={d} />
            ))}
          </div>
          {showResult ? (
            <div className="bg-bg rounded-2xl py-3 px-4">
              <div className={`font-title text-lg ${reward > 0 ? "text-mint" : "text-txt-3"}`}>
                {reward > 0 ? `🎉 ${outcome.tier}` : "锦鲤今天没上班…"}
              </div>
              <div className={`font-num text-2xl ${reward > 0 ? "text-c-green" : "text-txt-3"}`}>
                {reward > 0 ? `+¥${reward}` : "无奖励"}
              </div>
            </div>
          ) : (
            <div className="text-txt-3 text-sm animate-pulse py-2">骰子滚动中…</div>
          )}
          <StageInfoBar
            what="锦鲤池"
            who={`${current?.nickname ?? ""} 掷骰`}
            outcome={showResult ? (reward > 0 ? `${outcome.tier} +¥${reward}` : "无奖励") : "待揭晓"}
          />
        </>
      ) : (
        <div className="text-txt-3 text-sm animate-pulse py-4">{isMyTurn ? "准备掷骰…" : `等待 ${current?.nickname} 掷骰…`}</div>
      )}
    </div>
  );
}

// 金币雨：大奖时从顶部洒落
function CoinRain() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-xl animate-[coinfall_1.4s_ease-in_forwards]"
          style={{
            left: `${(i * 7 + 5) % 95}%`,
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
}
