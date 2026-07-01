import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";

interface ScoreBreakdown {
  cash: number;
  propertyValue: number;
  houses: number;
  hotels: number;
  mortgaged: number;
  jailCards: number;
  wish: number;
}
interface PlayerScore {
  playerId: string;
  nickname: string;
  emoji: string;
  bankrupt: boolean;
  score: number;
  breakdown: ScoreBreakdown;
}

const MEDAL = ["🥇", "🥈", "🥉"];

// 游戏结束计分排行榜：展示胜者 + 各玩家得分明细。
export default function Scoreboard() {
  const gameOver = useUiStore((s) => s.gameOver);
  const close = useUiStore((s) => s.closeGameOver);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  const scores = (gameOver?.scores ?? []) as PlayerScore[];
  const winnerId = gameOver?.winnerId ?? null;
  const winner = scores.find((s) => s.playerId === winnerId);

  return (
    <AnimatePresence>
      {gameOver && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative bg-surface rounded-3xl shadow-card w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
          >
            <div className="p-6 text-center bg-gradient-to-b from-coin/30 to-transparent">
              <div className="text-5xl mb-2">🏆</div>
              <h2 className="font-title text-2xl text-txt">游戏结束</h2>
              {winner && (
                <p className="text-txt-2 mt-1">
                  胜者 <span className="text-2xl align-middle">{winner.emoji}</span>{" "}
                  <span className="font-bold text-accent">{winner.nickname}</span>
                </p>
              )}
            </div>

            <div className="overflow-y-auto px-4 pb-2 space-y-2">
              {scores.map((s, i) => (
                <div
                  key={s.playerId}
                  className={`rounded-2xl p-3 ${
                    s.playerId === winnerId ? "bg-coin/20 ring-2 ring-coin" : "bg-bg"
                  } ${s.bankrupt ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 text-center font-title">
                      {MEDAL[i] ?? i + 1}
                    </span>
                    <span className="text-2xl">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm font-bold text-txt truncate">
                        {s.nickname}
                        {s.playerId === myPlayerId && (
                          <span className="ml-1 text-[10px] bg-mint text-white px-1.5 rounded-full">
                            我
                          </span>
                        )}
                        {s.bankrupt && (
                          <span className="ml-1 text-[10px] text-c-red">破产</span>
                        )}
                      </div>
                    </div>
                    <div className="font-num text-xl font-bold text-accent">
                      {s.score}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 pl-9 text-[11px] text-txt-3">
                    <span>现金 {Math.round(s.breakdown.cash)}</span>
                    <span>地产 {Math.round(s.breakdown.propertyValue)}</span>
                    {s.breakdown.houses > 0 && <span>房屋 {s.breakdown.houses}</span>}
                    {s.breakdown.hotels > 0 && <span>酒店 {s.breakdown.hotels}</span>}
                    {s.breakdown.mortgaged > 0 && (
                      <span>抵押 {Math.round(s.breakdown.mortgaged)}</span>
                    )}
                    {s.breakdown.jailCards > 0 && <span>通行证 {s.breakdown.jailCards}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4">
              <button
                onClick={close}
                className="w-full py-3 rounded-2xl bg-accent text-white font-title shadow-card hover:bg-accent-d transition-colors"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
