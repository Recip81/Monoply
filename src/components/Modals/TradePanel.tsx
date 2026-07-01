import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";
import { mapData } from "@/utils/cellPositions";
import { GROUP_COLORS } from "@/utils/constants";
import type { PlayerState } from "@shared/types";

// 交易面板：仅当前回合玩家可发起。
// 左栏「我方给出」/ 右栏「对方给出」：现金 + 地产（无房屋）+ 出狱通行证。
export default function TradePanel() {
  const open = useUiStore((s) => s.tradePanelOpen);
  const close = useUiStore((s) => s.closeTrade);
  const emit = useSocketStore((s) => s.emit);

  const players = useGameStore((s) => s.players);
  const board = useGameStore((s) => s.board);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  const me = players.find((p) => p.id === myPlayerId);
  const others = players.filter((p) => p.id !== myPlayerId && !p.bankrupt);

  const [targetId, setTargetId] = useState<string | null>(null);
  const [giveCash, setGiveCash] = useState(0);
  const [wantCash, setWantCash] = useState(0);
  const [giveProps, setGiveProps] = useState<number[]>([]);
  const [wantProps, setWantProps] = useState<number[]>([]);
  const [giveJail, setGiveJail] = useState(0);
  const [wantJail, setWantJail] = useState(0);

  const target = others.find((p) => p.id === targetId) ?? null;

  const reset = () => {
    setTargetId(null);
    setGiveCash(0);
    setWantCash(0);
    setGiveProps([]);
    setWantProps([]);
    setGiveJail(0);
    setWantJail(0);
  };

  const onClose = () => {
    reset();
    close();
  };

  const submit = () => {
    if (!target) return;
    emit("action", {
      type: "trade_offer",
      payload: {
        toId: target.id,
        giveCash,
        giveProperties: giveProps,
        giveJailCards: giveJail,
        wantCash,
        wantProperties: wantProps,
        wantJailCards: wantJail,
      },
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && me && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative bg-surface rounded-3xl shadow-card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-black/5">
              <h3 className="font-title text-xl text-txt text-center">发起交易</h3>
              {/* 选择对手 */}
              <div className="flex gap-2 justify-center mt-3 flex-wrap">
                {others.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setTargetId(p.id);
                      setWantProps([]);
                      setWantCash(0);
                      setWantJail(0);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all ${
                      targetId === p.id
                        ? "bg-accent text-white shadow-card-press"
                        : "bg-bg text-txt-2 hover:bg-accent/10"
                    }`}
                  >
                    <span>{p.emoji}</span>
                    {p.nickname}
                  </button>
                ))}
              </div>
            </div>

            {target ? (
              <div className="overflow-y-auto p-4 grid grid-cols-2 gap-4">
                <TradeSide
                  title="我方给出"
                  player={me}
                  board={board}
                  cash={giveCash}
                  setCash={setGiveCash}
                  selectedProps={giveProps}
                  toggleProp={(id) =>
                    setGiveProps((s) =>
                      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
                    )
                  }
                  jail={giveJail}
                  setJail={setGiveJail}
                />
                <TradeSide
                  title={`${target.nickname} 给出`}
                  player={target}
                  board={board}
                  cash={wantCash}
                  setCash={setWantCash}
                  selectedProps={wantProps}
                  toggleProp={(id) =>
                    setWantProps((s) =>
                      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
                    )
                  }
                  jail={wantJail}
                  setJail={setWantJail}
                />
              </div>
            ) : (
              <div className="p-10 text-center text-txt-3 text-sm">
                请选择交易对象
              </div>
            )}

            <div className="p-4 border-t border-black/5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-2xl bg-bg text-txt-2 font-title hover:bg-black/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={submit}
                disabled={!target}
                className="flex-1 py-2.5 rounded-2xl bg-accent text-white font-title shadow-card hover:bg-accent-d disabled:opacity-40 transition-colors"
              >
                发送交易请求
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TradeSide({
  title,
  player,
  board,
  cash,
  setCash,
  selectedProps,
  toggleProp,
  jail,
  setJail,
}: {
  title: string;
  player: PlayerState;
  board: Record<number, { owner: string | null; buildings: number; mortgaged: boolean }>;
  cash: number;
  setCash: (n: number) => void;
  selectedProps: number[];
  toggleProp: (id: number) => void;
  jail: number;
  setJail: (n: number) => void;
}) {
  // 可交易资产：地产/车站/公用事业，且无房屋（有房屋不可交易）
  const tradable = useMemo(() => {
    const all = [...player.properties, ...player.stations, ...player.utilities];
    return all
      .filter((id) => (board[id]?.buildings ?? 0) === 0)
      .sort((a, b) => a - b);
  }, [player, board]);

  return (
    <div className="bg-bg rounded-2xl p-3">
      <h4 className="font-title text-sm text-txt mb-2 text-center">{title}</h4>

      <label className="block mb-2">
        <span className="text-xs text-txt-3">现金（持有 ¥{player.cash}）</span>
        <input
          type="number"
          min={0}
          max={player.cash}
          value={cash}
          onChange={(e) =>
            setCash(Math.max(0, Math.min(player.cash, Math.floor(Number(e.target.value) || 0))))
          }
          className="w-full px-3 py-1.5 rounded-lg bg-surface outline-none focus:ring-2 focus:ring-accent font-num text-txt mt-1"
        />
      </label>

      <label className="block mb-2">
        <span className="text-xs text-txt-3">出狱通行证（持有 {player.getOutOfJailCards}）</span>
        <input
          type="number"
          min={0}
          max={player.getOutOfJailCards}
          value={jail}
          onChange={(e) =>
            setJail(
              Math.max(0, Math.min(player.getOutOfJailCards, Math.floor(Number(e.target.value) || 0)))
            )
          }
          className="w-full px-3 py-1.5 rounded-lg bg-surface outline-none focus:ring-2 focus:ring-accent font-num text-txt mt-1"
        />
      </label>

      <div className="text-xs text-txt-3 mb-1">地产（有房屋的不可交易）</div>
      <div className="space-y-1 max-h-44 overflow-y-auto">
        {tradable.length === 0 && (
          <div className="text-xs text-txt-3 py-2 text-center">无可交易地产</div>
        )}
        {tradable.map((id) => {
          const cell = mapData[id];
          const color = cell.group ? GROUP_COLORS[cell.group] : "#9490b0";
          const selected = selectedProps.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleProp(id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                selected ? "bg-accent/20 ring-1 ring-accent" : "bg-surface hover:bg-accent/10"
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span>{cell.emoji}</span>
              <span className="flex-1 text-left text-txt">{cell.name}</span>
              {board[id]?.mortgaged && <span className="text-c-red">抵押</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
