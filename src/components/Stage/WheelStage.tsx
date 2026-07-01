import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import { useEffect, useState } from "react";
import StageInfoBar from "./StageInfoBar";

// #8 幸运转盘。玩家点「转动转盘」后，outcome 由服务端统一延迟广播，
// 所有客户端同时收到 → CSS transition 同步启动转盘 → 全员同步。
const SEGMENTS = [
  { label: "大吉", sub: "+¥300" },
  { label: "中吉", sub: "+¥150" },
  { label: "小吉", sub: "+¥50" },
  { label: "平安", sub: "无事" },
  { label: "前进3", sub: "移动" },
  { label: "后退3", sub: "移动" },
  { label: "小凶", sub: "-¥100" },
  { label: "大凶", sub: "-¥250" },
];

export default function WheelStage() {
  const content = useUiStore((s) => s.stageContent);
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const current = players[currentTurnIndex];
  const isMyTurn = current?.id === myPlayerId;

  const [clicked, setClicked] = useState(false);
  // 结果文字在转盘停下来后再显示（CSS 转动 2.5s），避免提前泄露
  const [showResult, setShowResult] = useState(false);

  const outcome = content?.outcome; // { result, label, cash?, move? }
  const result: number | undefined = outcome?.result;
  const funWaiting = inputRequired?.type === "fun_trigger" && inputRequired.options?.funType === "lucky_wheel";

  const doClick = () => {
    setClicked(true);
    emit("action", { type: "fun_start", payload: { funType: "lucky_wheel" } });
  };

  // outcome 一到立刻开始转动（targetAngle 变化 → CSS transition），
  // 但结果文字延迟 2.5s 再显示（等转盘转完）
  useEffect(() => {
    if (outcome) {
      setShowResult(false);
      const id = setTimeout(() => setShowResult(true), 2500);
      return () => clearTimeout(id);
    }
  }, [outcome?.result]);

  const targetAngle = result ? -(((result - 1) * 45) + 360 * 5) : 0;

  const showBtn = funWaiting && isMyTurn && !clicked;

  return (
    <div className="text-center">
      <div className="text-5xl mb-2">🎡</div>
      <h3 className="font-title text-2xl text-txt mb-1">幸运转盘</h3>
      <p className="text-xs text-txt-3 mb-4">{current?.nickname} 的命运之轮</p>

      <div className="relative mx-auto w-52 h-52 mb-4">
        <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 text-2xl">🔻</div>
        <div
          className="w-full h-full rounded-full border-4 border-board-rim overflow-hidden transition-transform duration-[2500ms] ease-out"
          style={{
            transform: `rotate(${targetAngle}deg)`,
            background: `conic-gradient(from 0deg,
              #ff8c42 0deg 45deg, #ffd93d 45deg 90deg,
              #3ecfcf 90deg 135deg, #87CEEB 135deg 180deg,
              #2ECC71 180deg 225deg, #FF69B4 225deg 270deg,
              #E74C3C 270deg 315deg, #8E44AD 315deg 360deg)`,
          }}
        >
          {SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-left text-[10px] font-title text-white"
              style={{
                transform: `rotate(${i * 45 + 22.5}deg) translate(28px, -6px)`,
                textShadow: "0 1px 2px rgba(0,0,0,.4)",
              }}
            >
              {seg.label}
            </div>
          ))}
        </div>
      </div>

      {showBtn ? (
        <button
          onClick={doClick}
          className="w-full py-3 rounded-2xl bg-accent text-white font-title text-lg shadow-card hover:bg-accent-d transition-colors"
        >
          转动转盘
        </button>
      ) : showResult && outcome ? (
        <div className="bg-bg rounded-2xl py-3 px-4">
          <div className="font-title text-xl text-accent">{outcome.label}</div>
          {outcome.cash != null && (
            <div className={`font-num text-lg ${outcome.cash >= 0 ? "text-c-green" : "text-c-red"}`}>
              {outcome.cash >= 0 ? "+" : ""}¥{outcome.cash}
            </div>
          )}
          {outcome.move != null && (
            <div className="text-sm text-txt-2">{outcome.move > 0 ? "前进" : "后退"} {Math.abs(outcome.move)} 格</div>
          )}
        </div>
      ) : (
        <div className="text-txt-3 text-sm animate-pulse">{clicked ? "转盘转动中…" : `等待 ${current?.nickname} 转动…`}</div>
      )}

      <StageInfoBar
        what="幸运转盘"
        who={outcome ? `${current?.nickname} 转出 ${outcome.label}` : `${current?.nickname ?? ""} 转动`}
        outcome={outcome ? outcome.label : "待开奖"}
      />
    </div>
  );
}
