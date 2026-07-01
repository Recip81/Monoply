import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";
import { mapData } from "@/utils/cellPositions";
import { GROUP_COLORS, BUILD_COST } from "@/utils/constants";

// 抵押/卖房/建房管理面板：列出我方所有资产，按状态给出可执行操作。
// 仅在自己回合的 free_action 阶段，建房/卖房才有意义；抵押/赎回任意时刻可做。
export default function PropertyManage() {
  const open = useUiStore((s) => s.managePanelOpen);
  const close = useUiStore((s) => s.closeManage);
  const emit = useSocketStore((s) => s.emit);

  const board = useGameStore((s) => s.board);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const phase = useGameStore((s) => s.phase);

  const me = players.find((p) => p.id === myPlayerId);
  const isMyTurn = players[currentTurnIndex]?.id === myPlayerId;
  const canBuild = isMyTurn && phase === "free_action";

  const act = (type: string, cellId: number) =>
    emit("action", { type, payload: { cellId } });

  // 我拥有的全部资产（地产+车站+公用事业）
  const myCells = me
    ? [...me.properties, ...me.stations, ...me.utilities].sort((a, b) => a - b)
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative bg-surface rounded-3xl shadow-card w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-black/5">
              <h3 className="font-title text-xl text-txt text-center">资产管理</h3>
              <p className="text-center text-txt-3 text-xs mt-1">
                现金 <span className="font-num text-accent">¥{me?.cash ?? 0}</span>
                {!canBuild && " · 建房/卖房仅限自己回合的自由操作阶段"}
              </p>
            </div>

            <div className="overflow-y-auto p-4 space-y-2">
              {myCells.length === 0 && (
                <div className="text-center text-txt-3 text-sm py-8">
                  你还没有任何资产
                </div>
              )}
              {myCells.map((cellId) => (
                <ManageRow
                  key={cellId}
                  cellId={cellId}
                  slot={board[cellId]}
                  canBuild={canBuild}
                  cash={me?.cash ?? 0}
                  onAct={act}
                />
              ))}
            </div>

            <div className="p-4 border-t border-black/5">
              <button
                onClick={close}
                className="w-full py-2.5 rounded-2xl bg-bg text-txt-2 font-title hover:bg-black/5 transition-colors"
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

function floor10(n: number) {
  return Math.floor(n / 10) * 10;
}

function ManageRow({
  cellId,
  slot,
  canBuild,
  cash,
  onAct,
}: {
  cellId: number;
  slot: { owner: string | null; buildings: number; mortgaged: boolean } | undefined;
  canBuild: boolean;
  cash: number;
  onAct: (type: string, cellId: number) => void;
}) {
  const cell = mapData[cellId];
  if (!cell || !slot) return null;

  const groupColor = cell.group ? GROUP_COLORS[cell.group] : "#9490b0";
  const isProperty = cell.type === "property";
  const buildCost = cell.group ? BUILD_COST[cell.group] : 0;
  const faceValue = cell.type === "station" ? 200 : cell.price ?? 0;
  const mortgageAmount = floor10(faceValue * 0.5);
  const redeemCost = floor10(mortgageAmount * 1.1);

  const canBuildHere =
    canBuild && isProperty && !slot.mortgaged && slot.buildings < 5 && cash >= buildCost;
  const canSellHere = isProperty && slot.buildings > 0;
  const canMortgage = !slot.mortgaged && slot.buildings === 0;
  const canRedeem = slot.mortgaged && cash >= redeemCost;

  return (
    <div className="bg-bg rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: groupColor }}
        />
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
        {isProperty && (
          <MiniBtn
            label={slot.buildings === 4 ? `建酒店 ¥${buildCost}` : `建房 ¥${buildCost}`}
            disabled={!canBuildHere}
            onClick={() => onAct("build_house", cellId)}
          />
        )}
        {isProperty && (
          <MiniBtn
            label="卖房"
            disabled={!canSellHere}
            onClick={() => onAct("sell_house", cellId)}
          />
        )}
        {!slot.mortgaged ? (
          <MiniBtn
            label={`抵押 +¥${mortgageAmount}`}
            disabled={!canMortgage}
            onClick={() => onAct("mortgage", cellId)}
          />
        ) : (
          <MiniBtn
            label={`赎回 -¥${redeemCost}`}
            disabled={!canRedeem}
            accent
            onClick={() => onAct("redeem", cellId)}
          />
        )}
      </div>
    </div>
  );
}

function MiniBtn({
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
      className={`py-1.5 rounded-lg text-xs font-title transition-all disabled:opacity-30 ${
        accent
          ? "bg-accent text-white hover:bg-accent-d"
          : "bg-surface text-txt-2 hover:bg-accent/10"
      }`}
    >
      {label}
    </button>
  );
}
