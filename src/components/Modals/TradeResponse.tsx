import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";
import { mapData } from "@/utils/cellPositions";

// 交易接收方的应答弹窗：当 need_input 为 trade_respond 且我是接收方时弹出。
export default function TradeResponse() {
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  const offer =
    inputRequired?.type === "trade_respond" ? inputRequired.options?.offer : null;
  const isRecipient = offer && offer.toId === myPlayerId;

  if (!offer || !isRecipient) return null;

  const from = players.find((p) => p.id === offer.fromId);
  const respond = (accept: boolean) =>
    emit("action", { type: "trade_respond", payload: { tradeId: offer.id, accept } });

  const cellNames = (ids: number[]) =>
    ids.length ? ids.map((id) => mapData[id]?.name ?? "").join("、") : "—";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="relative bg-surface rounded-3xl shadow-card w-full max-w-md p-6 pointer-events-auto"
        >
          <div className="text-center mb-4">
            <div className="text-4xl mb-1">🤝</div>
            <h3 className="font-title text-xl text-txt">
              {from?.emoji} {from?.nickname} 想和你交易
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-bg rounded-2xl p-3">
              <div className="text-xs text-c-green font-title mb-1">你将获得</div>
              <Line label="现金" value={`¥${offer.giveCash}`} />
              <Line label="地产" value={cellNames(offer.giveProperties)} />
              <Line label="出狱卡" value={`${offer.giveJailCards}`} />
            </div>
            <div className="bg-bg rounded-2xl p-3">
              <div className="text-xs text-c-red font-title mb-1">你将付出</div>
              <Line label="现金" value={`¥${offer.wantCash}`} />
              <Line label="地产" value={cellNames(offer.wantProperties)} />
              <Line label="出狱卡" value={`${offer.wantJailCards}`} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => respond(false)}
              className="flex-1 py-2.5 rounded-2xl bg-bg text-txt-2 font-title hover:bg-black/5 transition-colors"
            >
              拒绝
            </button>
            <button
              onClick={() => respond(true)}
              className="flex-1 py-2.5 rounded-2xl bg-accent text-white font-title shadow-card hover:bg-accent-d transition-colors"
            >
              接受
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-txt-3">{label}</span>
      <span className="text-txt font-body">{value}</span>
    </div>
  );
}
