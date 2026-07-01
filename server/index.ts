import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { RoomManager } from "./rooms/RoomManager.js";
import {
  createRoomSchema,
  joinRoomSchema,
  roomIdSchema,
  actionSchema,
} from "./validators/schemas.js";

const PORT = Number(process.env.PORT) || 3002;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 生产构建产物目录（vite build 输出到项目根的 dist）
const distDir = path.resolve(__dirname, "..", "dist");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const manager = new RoomManager(io);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// 托管前端生产构建：远程访问（如 ngrok）走打包后的单一 bundle，
// 避免 dev server 逐个提供上千个模块导致的长时间白屏，且前后端同源。
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA 回退：非 /socket.io、非 /health 的路由都返回 index.html
  app.get(/^\/(?!socket\.io|health).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

io.on("connection", (socket) => {
  // 每个 socket 关联的房间号/玩家号
  let myRoomId: string | null = null;
  let myPlayerId: string | null = null;

  // ── 大厅事件 ──
  socket.on("create_room", (raw) => {
    const parsed = createRoomSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit("error", { message: "无效的创建房间请求" });
      return;
    }
    const { nickname, emoji } = parsed.data;
    const { room, playerId } = manager.createRoom(socket, nickname, emoji);
    myRoomId = room.id;
    myPlayerId = playerId;
    socket.emit("room_created", { roomId: room.id, playerId });
    room.emitRoomUpdate();
  });

  socket.on("join_room", (raw) => {
    const parsed = joinRoomSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit("error", { message: "无效的加入房间请求" });
      return;
    }
    const { roomId, nickname, emoji } = parsed.data;
    const result = manager.joinRoom(socket, roomId, nickname, emoji);
    if ("error" in result) {
      socket.emit("error", { message: result.error });
      return;
    }
    myRoomId = result.room.id;
    myPlayerId = result.playerId;
    socket.emit("room_joined", {
      roomId: result.room.id,
      playerId: result.playerId,
      players: result.room.toPlayerInfos(),
    });
    result.room.emitRoomUpdate();
  });

  socket.on("player_ready", (raw) => {
    const parsed = roomIdSchema.safeParse(raw);
    if (!parsed.success || !myPlayerId) return;
    const room = manager.getRoom(parsed.data.roomId);
    if (!room) return;
    const member = room.members.find((m) => m.playerId === myPlayerId);
    room.setReady(myPlayerId, member ? !member.ready : true);
  });

  socket.on("start_game", (raw) => {
    const parsed = roomIdSchema.safeParse(raw);
    if (!parsed.success || !myPlayerId) return;
    const room = manager.getRoom(parsed.data.roomId);
    if (!room) return;
    if (!room.canStart(myPlayerId)) {
      socket.emit("error", { message: "无法开始游戏（需至少 2 人且为房主）" });
      return;
    }
    room.startGame();
  });

  // ── 开局掷骰定顺序 ──
  socket.on("pre_roll", () => {
    if (!myRoomId || !myPlayerId) return;
    const room = manager.getRoom(myRoomId);
    if (!room) return;
    room.handlePreRoll(myPlayerId);
  });

  // ── 游戏事件 ──
  socket.on("action", (raw) => {
    const parsed = actionSchema.safeParse(raw);
    if (!parsed.success || !myRoomId || !myPlayerId) {
      socket.emit("error", { message: "无效的操作" });
      return;
    }
    const room = manager.getRoom(myRoomId);
    if (!room) return;
    room.handleAction(myPlayerId, parsed.data);
  });

  // 重连：客户端携带已有 roomId + playerId
  socket.on("rejoin", (raw: { roomId?: string; playerId?: string }) => {
    if (!raw?.roomId || !raw?.playerId) return;
    const room = manager.getRoom(raw.roomId);
    if (!room) {
      socket.emit("rejoin_failed", { roomId: raw.roomId, reason: "房间不存在或已结束" });
      return;
    }
    if (room.reconnect(socket.id, raw.playerId)) {
      myRoomId = room.id;
      myPlayerId = raw.playerId;
      room.joinSocket(socket);
      room.emitRoomUpdate();
      room.syncTo(socket);
    }
  });

  socket.on("disconnect", () => {
    if (!myRoomId) return;
    const room = manager.getRoom(myRoomId);
    if (!room) return;
    room.removeMember(socket.id);
    room.emitRoomUpdate();
    manager.cleanup();
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
