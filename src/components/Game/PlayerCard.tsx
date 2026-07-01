import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { PlayerState } from "@shared/types";
import { PLAYER_COLORS, GROUP_COLORS } from "@/utils/constants";
import { useGameStore } from "@/stores/gameStore";
import { mapData } from "@/utils/cellPositions";

// 单个玩家信息卡：头像 + 昵称 + 现金 + 资产数 + 状态。
// 鼠标悬停时在卡片左侧弹出该玩家的资产明细（地产/车站/公用事业 + 房屋/抵押状态）。
export default function PlayerCard({
  player,
  index,
  isCurrent,
  isMe,
}: {
  player: PlayerState;
  index: number;
  isCurrent: boolean;
  isMe: boolean;
}) {
  const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
  const board = useGameStore((s) => s.board);
  const assetCount =
    player.properties.length + player.stations.length + player.utilities.length;

  const [hovered, setHovered] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portalHovered = useRef(false); // 鼠标是否在资产浮层上

  const onEnter = () => {
    if (cardRef.current) setRect(cardRef.current.getBoundingClientRect());
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovered(true);
  };
  const onLeave = () => {
    // 延迟关闭，让用户有时间把鼠标移到资产浮层上
    closeTimer.current = setTimeout(() => {
      if (!portalHovered.current) setHovered(false);
    }, 200);
  };
  // 供 AssetTooltip 调用的回调
  const onPortalEnter = () => { portalHovered.current = true; if (closeTimer.current) clearTimeout(closeTimer.current); };
  const onPortalLeave = () => { portalHovered.current = false; setHovered(false); };

  return (
    <div
      ref={cardRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative rounded-2xl px-3 py-2.5 shadow-card transition-all ${
        player.bankrupt ? "opacity-40 grayscale" : ""
      } ${isCurrent ? "ring-2 ring-accent bg-surface" : "bg-surface/90"}`}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{player.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-body text-sm font-bold text-txt truncate">
              {player.nickname}
            </span>
            {isMe && (
              <span className="text-[10px] bg-mint text-white px-1.5 rounded-full">
                我
              </span>
            )}
            {!player.connected && (
              <span className="text-[10px] bg-txt-3 text-white px-1.5 rounded-full">
                离线
              </span>
            )}
          </div>
          <div className="font-num text-base font-bold text-c-green leading-tight">
            ¥{player.cash.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-txt-2">
        <span>🏠 {assetCount}</span>
        {player.getOutOfJailCards > 0 && <span>🎫 {player.getOutOfJailCards}</span>}
        {player.inJail && <span className="text-c-red">🔒 狱中</span>}
        {player.bankrupt && <span className="text-c-red">💀 破产</span>}
      </div>

      {hovered && rect && (
        <AssetTooltip player={player} board={board} anchor={rect} onEnter={onPortalEnter} onLeave={onPortalLeave} />
      )}
    </div>
  );
}

// 资产明细浮层：用 portal + fixed 定位，避免被侧栏的 overflow 裁剪。
function AssetTooltip({
  player,
  board,
  anchor,
  onEnter,
  onLeave,
}: {
  player: PlayerState;
  board: Record<number, { owner: string | null; buildings: number; mortgaged: boolean }>;
  anchor: DOMRect;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const cells = [...player.properties, ...player.stations, ...player.utilities].sort(
    (a, b) => a - b
  );

  // 默认弹到卡片左侧；若左侧空间不足则弹到右侧
  const WIDTH = 220;
  const GAP = 8;
  const leftSpace = anchor.left;
  const showLeft = leftSpace >= WIDTH + GAP;
  const left = showLeft ? anchor.left - WIDTH - GAP : anchor.right + GAP;
  const top = Math.min(anchor.top, window.innerHeight - 320);

  return createPortal(
    <div
      className="fixed z-[120]"
      style={{ left, top: Math.max(8, top), width: WIDTH }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="bg-surface rounded-2xl shadow-card p-3 max-h-[320px] overflow-y-auto pointer-events-auto">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-lg">{player.emoji}</span>
          <span className="font-title text-sm text-txt">{player.nickname} 的资产</span>
        </div>
        {cells.length === 0 ? (
          <div className="text-txt-3 text-xs text-center py-3">暂无地产</div>
        ) : (
          <div className="space-y-1">
            {cells.map((id) => {
              const cell = mapData[id];
              const slot = board[id];
              const groupColor = cell?.group ? GROUP_COLORS[cell.group] : "#9490b0";
              const built = slot?.buildings ?? 0;
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 text-xs bg-bg rounded-lg px-2 py-1"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: groupColor }}
                  />
                  <span>{cell?.emoji}</span>
                  <span className="flex-1 text-txt truncate">{cell?.name}</span>
                  {slot?.mortgaged && <span className="text-c-red">抵押</span>}
                  {built > 0 && (
                    <span className="text-txt-2">
                      {built === 5 ? "🏨" : `🏠${built}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
