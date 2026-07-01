import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { mapData } from "@/utils/cellPositions";
import { GROUP_COLORS } from "@/utils/constants";

// 地产详情弹窗：点击格子展示。Phase 1 只读展示（拥有者/价格）。
export default function PropertyDetail() {
  const cellId = useUiStore((s) => s.selectedCell);
  const close = useUiStore((s) => s.closePropertyDetail);
  const board = useGameStore((s) => s.board);
  const players = useGameStore((s) => s.players);

  const cell = cellId != null ? mapData[cellId] : null;
  const slot = cellId != null ? board[cellId] : undefined;
  const owner = slot?.owner ? players.find((p) => p.id === slot.owner) : null;
  const groupColor = cell?.group ? GROUP_COLORS[cell.group] : "#9490b0";

  return (
    <AnimatePresence>
      {cell && (
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
            className="relative bg-surface rounded-3xl shadow-card w-full max-w-xs overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部色条 */}
            <div className="h-3" style={{ background: groupColor }} />
            <div className="p-6 text-center">
              <div className="text-5xl mb-2">{cell.emoji}</div>
              <h3 className="font-title text-2xl text-txt">{cell.name}</h3>

              {cell.price != null && (
                <div className="mt-3 text-sm text-txt-2">
                  面值{" "}
                  <span className="font-num text-txt font-bold">¥{cell.price}</span>
                </div>
              )}

              <div className="mt-3 text-sm">
                {owner ? (
                  <span className="text-txt-2">
                    拥有者：{owner.emoji} {owner.nickname}
                  </span>
                ) : (
                  <span className="text-txt-3">无主</span>
                )}
              </div>

              {slot?.mortgaged && (
                <div className="mt-2 text-xs text-c-red">已抵押</div>
              )}
              {slot && slot.buildings > 0 && (
                <div className="mt-2 text-xs text-txt-2">
                  建筑等级：{slot.buildings === 5 ? "酒店 🏨" : `${slot.buildings} 栋房屋`}
                </div>
              )}

              <button
                onClick={close}
                className="mt-5 w-full py-2.5 rounded-2xl bg-bg text-txt-2 font-title hover:bg-black/5 transition-colors"
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
