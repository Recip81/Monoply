import { useState } from "react";
import { motion } from "framer-motion";
import { useSocketStore } from "@/stores/socketStore";
import { useGameStore } from "@/stores/gameStore";
import { PLAYER_EMOJIS } from "@/utils/constants";

type Tab = "create" | "join";

export default function LobbyPage() {
  const roomId = useSocketStore((s) => s.roomId);
  // 已在房间 → 等待室
  if (roomId) return <WaitingRoom />;
  return <LobbyEntry />;
}

function LobbyEntry() {
  const [tab, setTab] = useState<Tab>("create");

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-md bg-surface rounded-3xl shadow-card p-7"
      >
        <h1 className="font-title text-3xl text-center text-txt mb-1">
          🎲 城市大富翁
        </h1>
        <p className="text-center text-txt-3 text-sm mb-6">中国城市 · 联机对战</p>

        <div className="flex gap-2 mb-6 bg-bg rounded-2xl p-1">
          <TabButton active={tab === "create"} onClick={() => setTab("create")}>
            创建房间
          </TabButton>
          <TabButton active={tab === "join"} onClick={() => setTab("join")}>
            加入房间
          </TabButton>
        </div>

        {tab === "create" ? <CreateRoom /> : <JoinRoom />}
      </motion.div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-xl font-title text-sm transition-colors ${
        active ? "bg-accent text-white shadow-card-press" : "text-txt-2"
      }`}
    >
      {children}
    </button>
  );
}

function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PLAYER_EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onChange(e)}
          className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
            value === e
              ? "bg-accent/20 ring-2 ring-accent scale-105"
              : "bg-bg hover:bg-accent/10"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-4">
      <span className="block text-sm text-txt-2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-bg border-0 outline-none focus:ring-2 focus:ring-accent text-txt";

function CreateRoom() {
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(PLAYER_EMOJIS[0]);
  const emit = useSocketStore((s) => s.emit);

  const submit = () => {
    if (!nickname.trim()) return;
    emit("create_room", { nickname: nickname.trim(), emoji });
  };

  return (
    <div>
      <Field label="昵称">
        <input
          className={inputCls}
          value={nickname}
          maxLength={12}
          placeholder="输入你的昵称"
          onChange={(e) => setNickname(e.target.value)}
        />
      </Field>
      <Field label="选择棋子">
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </Field>
      <button
        onClick={submit}
        disabled={!nickname.trim()}
        className="w-full mt-2 py-3 rounded-2xl bg-accent text-white font-title text-lg shadow-card hover:bg-accent-d disabled:opacity-40 transition-colors"
      >
        创建房间
      </button>
    </div>
  );
}

function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState(PLAYER_EMOJIS[1]);
  const emit = useSocketStore((s) => s.emit);

  const submit = () => {
    if (!nickname.trim() || roomId.trim().length < 3) return;
    emit("join_room", {
      roomId: roomId.trim().toUpperCase(),
      nickname: nickname.trim(),
      emoji,
    });
  };

  return (
    <div>
      <Field label="房间号">
        <input
          className={`${inputCls} uppercase tracking-widest font-num`}
          value={roomId}
          maxLength={6}
          placeholder="如 ABCD"
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
        />
      </Field>
      <Field label="昵称">
        <input
          className={inputCls}
          value={nickname}
          maxLength={12}
          placeholder="输入你的昵称"
          onChange={(e) => setNickname(e.target.value)}
        />
      </Field>
      <Field label="选择棋子">
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </Field>
      <button
        onClick={submit}
        disabled={!nickname.trim() || roomId.trim().length < 3}
        className="w-full mt-2 py-3 rounded-2xl bg-mint text-white font-title text-lg shadow-card hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        加入房间
      </button>
    </div>
  );
}

function WaitingRoom() {
  const players = useSocketStore((s) => s.lobbyPlayers);
  const hostId = useSocketStore((s) => s.hostId);
  const myPlayerId = useSocketStore((s) => s.playerId);
  const roomId = useSocketStore((s) => s.roomId);
  const emit = useSocketStore((s) => s.emit);
  const clearSession = useSocketStore((s) => s.clearSession);

  const isHost = myPlayerId === hostId;
  const canStart = isHost && players.length >= 2;

  const leave = () => {
    clearSession();
    useGameStore.getState().reset();
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-md bg-surface rounded-3xl shadow-card p-7"
      >
        <h2 className="font-title text-2xl text-center text-txt mb-1">等待室</h2>
        <div className="text-center mb-6">
          <span className="text-txt-3 text-sm">房间号</span>
          <div className="font-num text-3xl tracking-widest text-accent">
            {roomId}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-bg rounded-2xl px-4 py-3"
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="flex-1 font-body text-txt">{p.nickname}</span>
              {p.id === hostId && (
                <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">
                  房主
                </span>
              )}
              {p.ready && p.id !== hostId && (
                <span className="text-xs bg-c-green text-white px-2 py-0.5 rounded-full">
                  已准备
                </span>
              )}
            </div>
          ))}
          {players.length < 6 &&
            Array.from({ length: 6 - players.length }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-2 border-dashed border-board-rim/30 rounded-2xl px-4 py-3 text-txt-3"
              >
                <span className="text-2xl opacity-30">👤</span>
                <span className="text-sm">等待玩家加入…</span>
              </div>
            ))}
        </div>

        {isHost ? (
          <button
            onClick={() => emit("start_game", { roomId })}
            disabled={!canStart}
            className="w-full py-3 rounded-2xl bg-accent text-white font-title text-lg shadow-card hover:bg-accent-d disabled:opacity-40 transition-colors"
          >
            {canStart ? "开始游戏" : "至少需要 2 名玩家"}
          </button>
        ) : (
          <button
            onClick={() => emit("player_ready", { roomId })}
            className="w-full py-3 rounded-2xl bg-mint text-white font-title text-lg shadow-card hover:opacity-90 transition-opacity"
          >
            准备 / 取消准备
          </button>
        )}
        <button
          onClick={leave}
          className="w-full mt-2 py-2.5 rounded-2xl bg-bg text-txt-3 font-title text-sm hover:bg-black/5 transition-colors"
        >
          退出房间
        </button>
      </motion.div>
    </div>
  );
}
