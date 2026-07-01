import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import { useSocketStore } from "@/stores/socketStore";
import { mapData } from "@/utils/cellPositions";
import { GROUP_COLORS } from "@/utils/constants";
import StageInfoBar from "./StageInfoBar";

// 第三幕：落地格事件展示。
// content 由服务端 buyableContent / 卡牌 / 税务 / 入狱 等富信息填充。
export default function EventStage() {
  const content = useUiStore((s) => s.stageContent);
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);

  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const current = players[currentTurnIndex];
  const isMyTurn = current?.id === myPlayerId;

  // ── 抽卡（命运/公共基金）：翻牌动画 ──
  if (content?.card) {
    const isFate = content.type === "fate";
    return (
      <div className="text-center">
        <div
          className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mb-3 animate-[flip_0.5s_ease-out]"
          style={{ background: isFate ? "#8E44AD22" : "#2C8E4022" }}
        >
          {content.emoji}
        </div>
        <h3 className="font-title text-2xl text-txt">{content.name}卡</h3>
        <div
          className="mt-4 mb-2 px-4 py-5 rounded-2xl text-white font-body text-lg leading-relaxed shadow-card"
          style={{
            background: isFate
              ? "linear-gradient(135deg,#8E44AD,#5b2c7d)"
              : "linear-gradient(135deg,#2C8E40,#1c5e2a)",
          }}
        >
          {content.card.description}
        </div>
        <StageInfoBar
          what={`${content.name}卡`}
          who={`${current?.nickname ?? ""} 抽卡`}
          outcome={content.card.description}
        />
      </div>
    );
  }

  const cellId: number | undefined = content?.cellId;
  const cell = cellId != null ? mapData[cellId] : null;
  if (!cell) return null;

  const groupColor = cell.group ? GROUP_COLORS[cell.group] : "#9490b0";
  const act = (type: string, payload?: any) => emit("action", { type, payload });

  // ── 入狱格 ──
  if (content?.type === "go_jail") {
    return (
      <div className="text-center">
        <div className="text-6xl mb-3 animate-[shake_0.5s]">⛓️</div>
        <h3 className="font-title text-2xl text-c-red">入狱！</h3>
        <p className="text-txt-2 text-sm mt-2">
          {current?.nickname} 被关进监狱，最多停留 3 回合
        </p>
        <StageInfoBar what="入狱格" who={`${current?.nickname ?? ""} 触发`} outcome="被关进监狱" danger />
      </div>
    );
  }

  // ── 税务格 ──
  if (content?.type === "tax") {
    return (
      <div className="text-center">
        <div className="text-6xl mb-3">💸</div>
        <h3 className="font-title text-2xl text-txt">{cell.name}</h3>
        <div className="mt-3 mb-2 font-num text-2xl text-c-red font-bold">
          缴纳 ¥{content.amount}
        </div>
        {content.detail && (
          <div className="text-xs text-txt-3 mb-2">{content.detail}</div>
        )}
        <div className="text-sm text-txt-2">
          {current?.nickname} ── ¥{content.amount} ──→ 🏦 银行
        </div>
        <StageInfoBar
          what={cell.name}
          who={`${current?.nickname ?? ""} 缴税`}
          outcome={`付 ¥${content.amount}`}
          danger
        />
      </div>
    );
  }

  // ── 地产 / 车站 / 公用事业 ──
  const ownerId: string | null = content?.ownerId ?? null;
  const owner = ownerId ? players.find((p) => p.id === ownerId) : null;
  const buildings: number = content?.buildings ?? 0;

  // 是否在等待本格购买
  const awaitingBuy =
    inputRequired?.type === "buy_property" &&
    inputRequired.options?.cellId === cellId;
  const buyPrice: number = content?.price ?? cell.price ?? 0;
  const canAfford: boolean = inputRequired?.options?.canAfford ?? false;

  const buildingLabel =
    buildings === 5 ? "🏨 酒店" : buildings > 0 ? `🏠 ${buildings} 栋房屋` : "空地";

  return (
    <div className="text-center">
      {/* 视觉区 */}
      <div
        className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mb-3"
        style={{ background: `${groupColor}22` }}
      >
        {cell.emoji}
      </div>
      <h3 className="font-title text-2xl text-txt">{cell.name}</h3>
      <div className="flex items-center justify-center gap-2 mt-1 mb-3">
        <span
          className="text-xs text-white px-2.5 py-0.5 rounded-full"
          style={{ background: groupColor }}
        >
          价格 ¥{buyPrice}
        </span>
        {owner && (
          <span className="text-xs text-txt-2">
            属于 {owner.emoji} {owner.nickname}
          </span>
        )}
      </div>

      {/* 租金表（地产） */}
      {cell.type === "property" && content?.rent && (
        <div className="grid grid-cols-3 gap-1 text-[11px] bg-bg rounded-2xl p-2 mb-3">
          <RentCell label="基础" value={content.rent.base} active={buildings === 0} />
          <RentCell label="1房" value={content.rent.house1} active={buildings === 1} />
          <RentCell label="2房" value={content.rent.house2} active={buildings === 2} />
          <RentCell label="3房" value={content.rent.house3} active={buildings === 3} />
          <RentCell label="4房" value={content.rent.house4} active={buildings === 4} />
          <RentCell label="酒店" value={content.rent.hotel} active={buildings === 5} />
        </div>
      )}

      {/* 车站传送目标 */}
      {cell.type === "station" && content?.teleportName && (
        <div className="text-sm text-txt-2 mb-3">
          🚄 将传送到 <span className="font-bold text-txt">{content.teleportName}</span>
          {owner && <span> · {content.stationCount} 个站 · 租金 ¥{content.currentRent}</span>}
        </div>
      )}

      {owner && cell.type === "property" && (
        <div className="text-xs text-txt-3 mb-2">当前：{buildingLabel}</div>
      )}

      {/* 操作区 */}
      {awaitingBuy && isMyTurn ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!canAfford}
            onClick={() => act("buy_property", { cellId })}
            className="py-3 rounded-2xl bg-accent text-white font-title shadow-card hover:bg-accent-d disabled:opacity-40 transition-colors"
          >
            购买 ¥{buyPrice}
          </button>
          <button
            onClick={() => act("skip_buy")}
            className="py-3 rounded-2xl bg-bg text-txt-2 font-title hover:bg-black/5 transition-colors"
          >
            放弃
          </button>
        </div>
      ) : awaitingBuy && !isMyTurn ? (
        <div className="text-txt-3 text-sm animate-pulse">
          等待 {current?.nickname} 决定是否购买…
        </div>
      ) : (
        <div className="text-txt-3 text-sm animate-pulse">结算中…</div>
      )}

      <StageInfoBar
        what={`${cell.name}${owner ? `（${owner.nickname}的）` : "（空地）"}`}
        who={awaitingBuy ? `${current?.nickname ?? ""} 抉择` : `${current?.nickname ?? ""} 落地`}
        outcome={
          owner
            ? owner.id === myPlayerId
              ? "自己的地产"
              : "需缴纳租金"
            : "可购买"
        }
      />
    </div>
  );
}

function RentCell({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div
      className={`rounded-lg py-1 ${
        active ? "bg-accent text-white font-bold" : "text-txt-2"
      }`}
    >
      <div className="text-[9px] opacity-80">{label}</div>
      <div className="font-num">¥{value}</div>
    </div>
  );
}
