import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";
import { mapData } from "@/utils/cellPositions";
import { GROUP_COLORS } from "@/utils/constants";

function floor10(n: number) {
  return Math.floor(n / 10) * 10;
}

// 破产自救面板：当某玩家现金为负时，服务端发 need_input("rescue")。
// 仅欠款玩家本人看到可操作面板（卖房/抵押补足现金），其余玩家看到等待提示。
// 若资产全部变现仍不足，或主动放弃，则宣告破产。
export default function RescuePanel() {
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);

  const board = useGameStore((s) => s.board);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const phase = useGameStore((s) => s.phase);

  const isRescue = inputRequired?.type === "rescue";
  const opts = isRescue ? inputRequired.options : null;
  const debtorId: string | null = opts?.debtorId ?? null;
  const debtor = debtorId ? players.find((p) => p.id === debtorId) : null;
  const isMe = debtorId === myPlayerId;

  const act = (type: string, cellId: number) =>
    emit("action", { type, payload: { cellId } });

  // 欠款玩家的全部资产
  const myCells = debtor
    ? [...debtor.properties, ...debtor.stations, ...debtor.utilities].sort((a, b) => a - b)
    : [];

  const deficit: number = opts?.deficit ?? 0;
  const canRecover: boolean = opts?.canRecover ?? false;

  // 游戏结束或债务人已破产时，不再显示自救面板（兜底防卡死）
  const show = isRescue && debtor && !debtor.bankrupt && phase !== "game_over";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative bg-surface rounded-3xl shadow-card w-full max-w-md max-h-[82vh] overflow-hidden flex flex-col pointer-events-auto"
          >
            <div className="p-5 border-b border-black/5 text-center">
              <div className="text-3xl mb-1">⚠️</div>
              <h3 className="font-title text-xl text-c-red">
                {isMe ? "现金不足，请自救" : `${debtor.nickname} 正在自救`}
              </h3>
              <p className="text-txt-3 text-xs mt-2">
                {debtor.emoji} {debtor.nickname} 还差{" "}
                <span className="font-num text-c-red font-bold">¥{deficit}</span>
                （当前现金 <span className="font-num">¥{debtor.cash}</span>）
              </p>
              {isMe && (
                <p className="text-txt-3 text-xs mt-1">
                  卖房或抵押地产来补足；{canRecover ? "变现后可渡过难关" : "即使全部变现也不够，只能宣告破产"}
                </p>
              )}
            </div>

            {isMe ? (
              <>
                <div className="overflow-y-auto p-4 space-y-2">
                  {myCells.length === 0 && (
                    <div className="text-center text-txt-3 text-sm py-6">没有可变现的资产了</div>
                  )}
                  {myCells.map((cellId) => (
                    <RescueRow key={cellId} cellId={cellId} slot={board[cellId]} onAct={act} />
                  ))}
                </div>
                <div className="p-4 border-t border-black/5 space-y-2">
                  <button
                    onClick={() => useUiStore.getState().openTrade(null)}
                    className="w-full py-2.5 rounded-2xl bg-mint text-white font-title shadow-card hover:opacity-90 transition-opacity"
                  >
                    🤝 发起交易
                  </button>
                  <button
                    onClick={() => emit("action", { type: "declare_bankrupt" })}
                    className="w-full py-2.5 rounded-2xl bg-c-red text-white font-title shadow-card hover:opacity-90 transition-opacity"
                  >
                    宣告破产
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-txt-3 text-sm animate-pulse">
                等待 {debtor.nickname} 处理资产…
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RescueRow({
  cellId,
  slot,
  onAct,
}: {
  cellId: number;
  slot: { owner: string | null; buildings: number; mortgaged: boolean } | undefined;
  onAct: (type: string, cellId: number) => void;
}) {
  const cell = mapData[cellId];
  if (!cell || !slot) return null;

  const groupColor = cell.group ? GROUP_COLORS[cell.group] : "#9490b0";
  const isProperty = cell.type === "property";
  const faceValue = cell.type === "station" ? 200 : cell.price ?? 0;
  const mortgageAmount = floor10(faceValue * 0.5);

  const canSell = isProperty && slot.buildings > 0;
  const canMortgage = !slot.mortgaged && slot.buildings === 0;

  return (
    <div className="bg-bg rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: groupColor }} />
        <span className="text-lg">{cell.emoji}</span>
        <span className="flex-1 font-body text-sm text-txt">{cell.name}</span>
        {slot.mortgaged && <span className="text-xs text-c-red">已抵押</span>}
        {slot.buildings > 0 && (
          <span className="text-xs text-txt-2">
            {slot.buildings === 5 ? "🏨 酒店" : `🏠 ${slot.buildings}`}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <MiniBtn label="卖房" disabled={!canSell} onClick={() => onAct("sell_house", cellId)} />
        <MiniBtn
          label={`抵押 +¥${mortgageAmount}`}
          disabled={!canMortgage}
          onClick={() => onAct("mortgage", cellId)}
        />
      </div>
    </div>
  );
}

function MiniBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="py-1.5 rounded-lg text-xs font-title transition-all disabled:opacity-30 bg-surface text-txt-2 hover:bg-accent/10"
    >
      {label}
    </button>
  );
}
