import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";

// 金币变动浮动数字：cash_change 时从底部飘上并淡出。
// 集中显示在棋盘上方中央，按玩家颜色区分。
export default function CoinFloat() {
  const coins = useUiStore((s) => s.coins);
  const removeCoin = useUiStore((s) => s.removeCoin);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-start justify-center">
      <div className="relative mt-24 w-0">
        <AnimatePresence>
          {coins.map((c, i) => (
            <CoinRow
              key={c.id}
              id={c.id}
              playerId={c.playerId}
              amount={c.amount}
              index={i}
              onDone={removeCoin}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CoinRow({
  id,
  playerId,
  amount,
  index,
  onDone,
}: {
  id: number;
  playerId: string;
  amount: number;
  index: number;
  onDone: (id: number) => void;
}) {
  const players = useGameStore((s) => s.players);
  const p = players.find((x) => x.id === playerId);

  useEffect(() => {
    const t = setTimeout(() => onDone(id), 1400);
    return () => clearTimeout(t);
  }, [id, onDone]);

  const positive = amount >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.7, x: -50 }}
      animate={{ opacity: 1, y: -40 - index * 8, scale: 1 }}
      exit={{ opacity: 0, y: -80 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="absolute left-0 -translate-x-1/2 whitespace-nowrap font-num font-bold text-2xl"
      style={{
        color: positive ? "#2ECC71" : "#E74C3C",
        textShadow: "0 2px 4px rgba(0,0,0,.25)",
      }}
    >
      <span className="text-base mr-1">{p?.emoji}</span>
      {positive ? "+" : ""}¥{Math.abs(amount)}
    </motion.div>
  );
}
