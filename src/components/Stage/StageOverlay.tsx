import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "@/stores/uiStore";
import DiceStage from "./DiceStage";
import EventStage from "./EventStage";
import WheelStage from "./WheelStage";
import ArenaStage from "./ArenaStage";
import WishStage from "./WishStage";
import BlackMarketStage from "./BlackMarketStage";
import LotteryStage from "./LotteryStage";
import DemolitionStage from "./DemolitionStage";
import KoiStage from "./KoiStage";

// 中央舞台容器：半透明遮罩 + 卡片，覆盖在 Canvas 上方。
// 各幕/趣味格共用此容器，按 stageType 路由到对应内容组件。
export default function StageOverlay() {
  const visible = useUiStore((s) => s.stageVisible);
  const stageType = useUiStore((s) => s.stageType);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* 卡片 */}
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative bg-surface rounded-3xl shadow-card p-7 min-w-[340px] max-w-[460px] pointer-events-auto"
          >
            {stageType === "dice" && <DiceStage />}
            {stageType === "event" && <EventStage />}
            {stageType === "wheel" && <WheelStage />}
            {stageType === "arena" && <ArenaStage />}
            {stageType === "wish" && <WishStage />}
            {stageType === "black_market" && <BlackMarketStage />}
            {stageType === "lottery" && <LotteryStage />}
            {stageType === "demolition" && <DemolitionStage />}
            {stageType === "koi" && <KoiStage />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
