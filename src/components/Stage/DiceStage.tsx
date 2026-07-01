import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";

// 第一幕：掷骰子舞台。
// 展示当前玩家 + 骰子结果；轮到自己时显示掷骰按钮；在狱中显示三个出狱选项。
export default function DiceStage() {
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const phase = useGameStore((s) => s.phase);
  const emit = useSocketStore((s) => s.emit);

  const dice = useUiStore((s) => s.diceValues);
  const isDouble = useUiStore((s) => s.diceDouble);
  const inputRequired = useUiStore((s) => s.inputRequired);

  const current = players[currentTurnIndex];
  const isMyTurn = current?.id === myPlayerId;
  const act = (type: string, payload?: any) => emit("action", { type, payload });

  const inJailChoice = phase === "jail_choice";
  const jailOpts = inputRequired?.type === "jail_choice" ? inputRequired.options : null;

  // 骰子滚动结束后（约 0.85s，与 Die 滚动时长一致）才显示合计/双骰，避免提前泄露点数
  const [settled, setSettled] = useState(false);
  const diceKey = dice ? `${dice[0]}-${dice[1]}` : null;
  useEffect(() => {
    if (!diceKey) {
      setSettled(false);
      return;
    }
    setSettled(false);
    const t = setTimeout(() => setSettled(true), 850);
    return () => clearTimeout(t);
  }, [diceKey]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 当前玩家 */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">{current?.emoji}</span>
        <span className="font-title text-xl text-txt">{current?.nickname}</span>
      </div>

      {/* 骰子 */}
      <div className="flex gap-4 my-2">
        {[0, 1].map((i) => (
          <Die key={i} value={dice ? dice[i] : null} />
        ))}
      </div>

      {dice && settled && (
        <div className="font-num text-2xl text-accent font-bold">
          {dice[0] + dice[1]} 点
        </div>
      )}
      {dice && settled && isDouble && (
        <div className="font-title text-c-green animate-bounce">✨ 双骰！再掷一次</div>
      )}

      {/* 操作区 */}
      {inJailChoice && isMyTurn ? (
        <div className="flex flex-col gap-2 w-full mt-2">
          <div className="text-center text-sm text-txt-2">你在监狱中</div>
          <StageBtn
            label="💰 支付保释金 ¥75"
            disabled={!jailOpts?.canPay}
            onClick={() => act("jail_pay")}
          />
          <StageBtn label="🎲 掷骰碰运气（双骰出狱）" onClick={() => act("jail_roll")} />
          <StageBtn
            label="🎟️ 使用出狱通行证"
            disabled={!jailOpts?.hasCard}
            onClick={() => act("jail_card")}
          />
        </div>
      ) : phase === "rolling" && isMyTurn && !dice ? (
        <StageBtn label="🎲 掷骰子" accent onClick={() => act("roll_dice")} />
      ) : (
        <div className="text-sm text-txt-3 mt-1">
          {isMyTurn ? "" : `等待 ${current?.nickname} 行动…`}
        </div>
      )}
    </div>
  );
}

function Die({ value }: { value: number | null }) {
  // 滚动效果：value 确定前/刚确定时，快速跳变随机点数约 0.8s 再定格到真实值
  const [display, setDisplay] = useState<number | null>(value);
  const [rolling, setRolling] = useState(false);
  const prev = useRef<number | null>(value);

  useEffect(() => {
    // 从「无值」变为「有值」时，先滚动再定格
    if (value != null && prev.current == null) {
      setRolling(true);
      let ticks = 0;
      const iv = setInterval(() => {
        setDisplay(1 + Math.floor(Math.random() * 6));
        ticks += 1;
        if (ticks >= 10) {
          clearInterval(iv);
          setDisplay(value);
          setRolling(false);
        }
      }, 80);
      prev.current = value;
      return () => clearInterval(iv);
    }
    setDisplay(value);
    prev.current = value;
  }, [value]);

  return (
    <motion.div
      animate={
        value == null
          ? { rotate: [0, 360] }
          : rolling
          ? { rotate: [0, 360], scale: [1, 1.12, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={
        value == null
          ? { repeat: Infinity, duration: 0.6, ease: "linear" }
          : rolling
          ? { repeat: Infinity, duration: 0.18, ease: "linear" }
          : { type: "spring", stiffness: 260, damping: 12 }
      }
      className="w-16 h-16 bg-white rounded-2xl shadow-card flex items-center justify-center font-num text-3xl font-bold text-txt"
    >
      {display ?? "?"}
    </motion.div>
  );
}

function StageBtn({
  label,
  onClick,
  disabled,
  accent,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-2xl font-title text-base transition-all disabled:opacity-30 ${
        accent
          ? "bg-accent text-white shadow-card hover:bg-accent-d"
          : "bg-bg text-txt hover:bg-accent/10"
      }`}
    >
      {label}
    </button>
  );
}
