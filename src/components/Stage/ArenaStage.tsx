import { useUiStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useSocketStore } from "@/stores/socketStore";
import { useState } from "react";
import RollingDie from "./RollingDie";
import StageInfoBar from "./StageInfoBar";

// #16 擂台挑战：选对手 → 双方同时看到各自"摇骰子"按钮 → 各自独立摇 → 揭晓结果。
// 所有客户端实时看到双方骰子变化（arena_roll 事件广播）。
export default function ArenaStage() {
  const content = useUiStore((s) => s.stageContent);
  const inputRequired = useUiStore((s) => s.inputRequired);
  const emit = useSocketStore((s) => s.emit);

  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  // 骰子值（arena_roll 广播，增量合并，双方值都会逐步出现）
  const arenaDice = content?.arenaDice;
  // 对决结果（player_acted 延迟发来，含 winnerId/amount）
  const outcome = content?.outcome;

  // ── 选择对手阶段 ──
  const opponents: { id: string; nickname: string; emoji: string }[] =
    inputRequired?.type === "select_opponent" ? inputRequired.options?.opponents ?? [] : [];
  const selectOpponent = (targetId: string) =>
    emit("action", { type: "select_opponent", payload: { targetId } });

  // ── 决战按钮阶段 ──
  const funWaiting = inputRequired?.type === "fun_trigger" && inputRequired.options?.funType === "arena";
  const [fightClicked, setFightClicked] = useState(false);
  const startFight = () => { setFightClicked(true); emit("action", { type: "fun_start", payload: { funType: "arena" } }); };
  const showFightBtn = funWaiting && !fightClicked && opponents.length === 0;

  // ── 同时摇骰阶段 ──
  const rollOpts = inputRequired?.type === "arena_roll" ? inputRequired.options : null;
  const amChallenger = rollOpts?.challengerId === myPlayerId;
  const amOpponent = rollOpts?.opponentId === myPlayerId;
  const amFighter = amChallenger || amOpponent;
  const myRollDone = amChallenger ? arenaDice?.challengerRoll != null : amOpponent ? arenaDice?.opponentRoll != null : true;
  const [iRolling, setIRolling] = useState(false);
  const doRoll = () => { setIRolling(true); emit("action", { type: "arena_roll" }); };

  const showRollBtn = rollOpts && amFighter && !myRollDone && !iRolling;

  const nameOf = (id: string | null) => (id ? players.find((p) => p.id === id)?.nickname ?? "" : "");
  const chName = rollOpts?.challengerName ?? nameOf(arenaDice?.challengerId) ?? "";
  const opName = rollOpts?.opponentName ?? nameOf(arenaDice?.opponentId) ?? "";

  // ── 骰子显示：只要任一方摇过就展示 VS 区，未摇的一方显示"?" ──
  const anyRolled = arenaDice?.challengerRoll != null || arenaDice?.opponentRoll != null;
  const bothRolled = arenaDice?.challengerRoll != null && arenaDice?.opponentRoll != null;

  return (
    <div className="text-center">
      <div className="text-5xl mb-2">⚔️</div>
      <h3 className="font-title text-2xl text-txt mb-1">擂台挑战</h3>

      {/* ── 选择对手 ── */}
      {opponents.length > 0 ? (
        <>
          <p className="text-xs text-txt-3 mb-4">选择一名对手掷骰对决，点数大者赢，输家付 ¥150</p>
          <div className="grid grid-cols-2 gap-2">
            {opponents.map((o) => (
              <button key={o.id} onClick={() => selectOpponent(o.id)}
                className="flex flex-col items-center gap-1 bg-bg rounded-2xl px-3 py-3 hover:bg-accent/10 transition-colors">
                <span className="text-2xl">{o.emoji}</span>
                <span className="text-sm text-txt">{o.nickname}</span>
                <span className="text-[10px] text-accent">挑战</span>
              </button>
            ))}
          </div>
        </>
      ) : showFightBtn ? (
        <>
          <p className="text-sm text-txt-3 mb-4">对手已选定，点击开始对决</p>
          <button onClick={startFight}
            className="w-full py-3 rounded-2xl bg-accent text-white font-title text-lg shadow-card hover:bg-accent-d transition-colors">
            决战
          </button>
        </>
      ) : anyRolled || showRollBtn || rollOpts ? (
        <>
          {/* ── 骰子展示区（任一方摇过就出现，全员可见）── */}
          <p className="text-xs text-txt-3 mb-3">
            {chName} VS {opName} · 各点按钮摇自己的骰子
          </p>
          <div className="flex items-center justify-center gap-4 my-3">
            {/* 挑战者骰子 */}
            <div>
              <RollingDie value={arenaDice?.challengerRoll ?? null} />
              <div className="text-xs text-txt-2 mt-1">{chName}</div>
              {arenaDice?.challengerRoll == null && (
                <div className="text-[10px] text-txt-3 mt-0.5">未摇</div>
              )}
            </div>
            <span className="font-title text-txt-3 text-xl">VS</span>
            {/* 对手骰子 */}
            <div>
              <RollingDie value={arenaDice?.opponentRoll ?? null} />
              <div className="text-xs text-txt-2 mt-1">{opName}</div>
              {arenaDice?.opponentRoll == null && (
                <div className="text-[10px] text-txt-3 mt-0.5">未摇</div>
              )}
            </div>
          </div>

          {/* ── 我的摇骰按钮 ── */}
          {showRollBtn && (
            <button onClick={doRoll}
              className="w-full py-3 rounded-2xl bg-mint text-white font-title text-lg shadow-card hover:opacity-90 transition-colors mb-2">
              摇骰子
            </button>
          )}
          {rollOpts && amFighter && myRollDone && !bothRolled && (
            <div className="text-txt-3 text-sm animate-pulse">等待对方摇骰子…</div>
          )}
          {!amFighter && rollOpts && !bothRolled && (
            <div className="text-txt-3 text-sm animate-pulse">
              等待 {chName} 和 {opName} 摇骰子…
            </div>
          )}

          {/* ── 结果 ── */}
          {outcome && bothRolled ? (
            <div className="bg-bg rounded-2xl py-3 px-4 font-title text-lg mt-2">
              {outcome.winnerId
                ? `🏆 ${nameOf(outcome.winnerId)} 获胜，赢得 ¥${outcome.amount}`
                : "平局，无人支付"}
            </div>
          ) : bothRolled ? (
            <div className="text-txt-3 text-sm animate-pulse mt-2">揭晓结果中…</div>
          ) : null}

          <StageInfoBar
            what="擂台挑战"
            who={`${chName} VS ${opName}`}
            outcome={outcome ? (outcome.winnerId ? `${nameOf(outcome.winnerId)} 赢 ¥${outcome.amount}` : "平局") : "各自摇骰"} />
        </>
      ) : (
        <div className="text-txt-3 text-sm animate-pulse py-4">
          等待 {players[currentTurnIndex]?.nickname} 选择对手…
        </div>
      )}
    </div>
  );
}
