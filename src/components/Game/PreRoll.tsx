import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import RollingDie from "../Stage/RollingDie";
import { useSocketStore } from "@/stores/socketStore";
import { useGameStore } from "@/stores/gameStore";

// 开局掷骰定顺序：所有人各摇一个骰子，高点数先走。
// 服务端发 game_pre_roll → pre_roll 动作摇骰 → pre_roll_result 广播各人结果
// → pre_roll_order 最终排序 → 正式开始。
interface RollState {
  [playerId: string]: number;
}

export default function PreRoll({
  players,
}: {
  players: { id: string; nickname: string; emoji: string }[];
}) {
  const emit = useSocketStore((s) => s.emit);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  const [rolls, setRolls] = useState<RollState>({});
  const [iRolled, setIRolled] = useState(false);
  const [order, setOrder] = useState<{ index: number; playerId: string; nickname: string; emoji: string; roll: number }[] | null>(null);

  const sockRef = useRef(useSocketStore.getState().socket);

  useEffect(() => {
    const socket = sockRef.current;
    if (!socket) return;

    const onResult = (data: { playerId: string; roll: number }) => {
      setRolls((prev) => ({ ...prev, [data.playerId]: data.roll }));
    };
    const onOrder = (data: { order: any[] }) => {
      setOrder(data.order);
    };

    socket.on("pre_roll_result", onResult);
    socket.on("pre_roll_order", onOrder);
    return () => {
      socket.off("pre_roll_result", onResult);
      socket.off("pre_roll_order", onOrder);
    };
  }, []);

  const doRoll = () => {
    setIRolled(true);
    emit("pre_roll");
  };

  const allRolled = players.every((p) => rolls[p.id] != null);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="w-full max-w-lg bg-surface rounded-3xl shadow-card p-7"
      >
        <h2 className="font-title text-2xl text-txt text-center mb-1">
          🎲 骰子定顺序
        </h2>
        <p className="text-center text-txt-3 text-sm mb-5">
          每人摇一颗骰子，按点数从高到低决定出场顺序
        </p>

        {/* 各玩家骰子 */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {players.map((p) => {
            const rolled = rolls[p.id] != null;
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-3 text-center ${
                  isMe ? "ring-2 ring-accent bg-accent/5" : "bg-bg"
                }`}
              >
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="font-body text-xs text-txt truncate mb-1">{p.nickname}</div>
                <RollingDie value={rolled ? rolls[p.id] : null} size={40} />
                {!rolled && (
                  <div className="text-[10px] text-txt-3 mt-0.5">未摇</div>
                )}
              </div>
            );
          })}
        </div>

        {/* 操作区 */}
        {order ? (
          <div className="bg-bg rounded-2xl p-4">
            <div className="font-title text-sm text-txt text-center mb-2">出场顺序</div>
            {order.map((o, i) => (
              <div key={o.playerId} className="flex items-center gap-2 text-sm py-1">
                <span className="font-num text-accent w-6">{i + 1}.</span>
                <span>{o.emoji}</span>
                <span className="flex-1 text-txt">{o.nickname}</span>
                <span className="font-num text-txt-3">🎲 {o.roll}</span>
              </div>
            ))}
          </div>
        ) : !allRolled && !iRolled ? (
          <button
            onClick={doRoll}
            className="w-full py-3 rounded-2xl bg-accent text-white font-title text-lg shadow-card hover:bg-accent-d transition-colors"
          >
            摇骰子
          </button>
        ) : iRolled && !allRolled ? (
          <div className="text-txt-3 text-sm text-center animate-pulse">
            等待其他玩家摇骰子…
          </div>
        ) : allRolled && !order ? (
          <div className="text-txt-3 text-sm text-center animate-pulse">
            排序中…
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
