import type { Server, Socket } from "socket.io";
import { GameRoom, type RoomMember } from "./GameRoom.js";

function genRoomId(): string {
  // 4 位大写字母 + 数字
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function genPlayerId(): string {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

// 全局房间管理：创建/查找/加入/清理。
export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  createRoom(
    socket: Socket,
    nickname: string,
    emoji: string
  ): { room: GameRoom; playerId: string } {
    let id = genRoomId();
    while (this.rooms.has(id)) id = genRoomId();

    const playerId = genPlayerId();
    const host: RoomMember = {
      socketId: socket.id,
      playerId,
      nickname,
      emoji,
      ready: true,
      connected: true,
    };
    const room = new GameRoom(this.io, id, host);
    this.rooms.set(id, room);
    room.joinSocket(socket);
    return { room, playerId };
  }

  joinRoom(
    socket: Socket,
    roomId: string,
    nickname: string,
    emoji: string
  ): { room: GameRoom; playerId: string } | { error: string } {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return { error: "房间不存在" };
    if (room.phase !== "lobby") return { error: "游戏已开始，无法加入" };
    if (room.members.length >= 6) return { error: "房间已满" };

    const playerId = genPlayerId();
    const member: RoomMember = {
      socketId: socket.id,
      playerId,
      nickname,
      emoji,
      ready: false,
      connected: true,
    };
    if (!room.addMember(member)) return { error: "无法加入房间" };
    room.joinSocket(socket);
    return { room, playerId };
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  // 通过 socketId 查找其所在房间（用于断线处理）
  findRoomBySocket(socketId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.members.some((m) => m.socketId === socketId)) return room;
    }
    return undefined;
  }

  removeRoom(roomId: string) {
    this.rooms.delete(roomId.toUpperCase());
  }

  // 清理空房间
  cleanup() {
    for (const [id, room] of this.rooms) {
      if (room.members.length === 0 || room.isEmpty) {
        this.rooms.delete(id);
      }
    }
  }
}
