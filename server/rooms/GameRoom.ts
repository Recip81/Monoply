import type { Server, Socket } from "socket.io";
import type { PlayerInfo, ActionMessage } from "@shared/types";
import { Player } from "../game/Player.js";
import { GameState } from "../game/GameState.js";
import { TurnManager } from "../game/TurnManager.js";

export interface RoomMember {
  socketId: string;
  playerId: string;
  nickname: string;
  emoji: string;
  ready: boolean;
  connected: boolean;
}

export type RoomPhase = "lobby" | "pre_roll" | "playing" | "finished";

// 单个房间实例：大厅 → 开局掷骰定顺序 → 正式游戏 → 结束。
export class GameRoom {
  id: string;
  hostId: string;
  members: RoomMember[] = [];
  phase: RoomPhase = "lobby";
  state: GameState | null = null;
  turnManager: TurnManager | null = null;
  // 开局掷骰：playerId → 点数
  preRolls: Map<string, number> = new Map();

  private io: Server;

  constructor(io: Server, id: string, host: RoomMember) {
    this.io = io;
    this.id = id;
    this.hostId = host.playerId;
    this.members.push(host);
  }

  private get roomChannel(): string {
    return `room:${this.id}`;
  }

  // 向房间内所有 socket 广播
  broadcast = (event: string, payload: any) => {
    this.io.to(this.roomChannel).emit(event, payload);
  };

  joinSocket(socket: Socket) {
    socket.join(this.roomChannel);
  }

  addMember(member: RoomMember): boolean {
    if (this.phase !== "lobby") return false;
    if (this.members.length >= 6) return false;
    this.members.push(member);
    return true;
  }

  removeMember(socketId: string) {
    const m = this.members.find((x) => x.socketId === socketId);
    if (!m) return;
    if (this.phase === "lobby") {
      this.members = this.members.filter((x) => x.socketId !== socketId);
      // 房主离开 → 转移房主
      if (m.playerId === this.hostId && this.members.length > 0) {
        this.hostId = this.members[0].playerId;
      }
    } else {
      // 游戏中：标记离线，保留席位以便重连
      m.connected = false;
      const ps = this.state?.getPlayer(m.playerId);
      if (ps) ps.connected = false;
    }
  }

  reconnect(socketId: string, playerId: string): boolean {
    const m = this.members.find((x) => x.playerId === playerId);
    if (!m) return false;
    m.socketId = socketId;
    m.connected = true;
    const ps = this.state?.getPlayer(playerId);
    if (ps) ps.connected = true;
    return true;
  }

  toPlayerInfos(): PlayerInfo[] {
    return this.members.map((m) => ({
      id: m.playerId,
      nickname: m.nickname,
      emoji: m.emoji,
      ready: m.ready,
    }));
  }

  emitRoomUpdate() {
    this.broadcast("room_update", {
      players: this.toPlayerInfos(),
      hostId: this.hostId,
    });
  }

  setReady(playerId: string, ready: boolean) {
    const m = this.members.find((x) => x.playerId === playerId);
    if (m) m.ready = ready;
    this.emitRoomUpdate();
  }

  canStart(playerId: string): boolean {
    return (
      this.phase === "lobby" &&
      playerId === this.hostId &&
      this.members.length >= 2
    );
  }

  startGame() {
    if (this.phase !== "lobby") return;
    // 进入"开局掷骰定顺序"阶段
    this.phase = "pre_roll";
    this.preRolls.clear();
    this.broadcast("game_pre_roll", {
      players: this.members.map((m) => ({ id: m.playerId, nickname: m.nickname, emoji: m.emoji })),
    });
  }

  handlePreRoll(playerId: string) {
    if (this.phase !== "pre_roll") return;
    if (this.preRolls.has(playerId)) return; // 已摇过
    const roll = 1 + Math.floor(Math.random() * 6);
    this.preRolls.set(playerId, roll);
    this.broadcast("pre_roll_result", { playerId, roll });

    // 全部摇完 → 排序并开始游戏
    if (this.preRolls.size >= this.members.length) {
      this.beginGameWithOrder();
    }
  }

  // 按点数降序排列玩家，相同点数则保持原顺序(draw不重要)，创建 GameState 并开始
  private beginGameWithOrder() {
    // 按摇出的点数降序
    const sorted = [...this.members].sort((a, b) => {
      const ra = this.preRolls.get(a.playerId) ?? 0;
      const rb = this.preRolls.get(b.playerId) ?? 0;
      if (rb !== ra) return rb - ra;
      // 同点数：保持大厅加入顺序
      return 0;
    });
    this.broadcast("pre_roll_order", {
      order: sorted.map((m, i) => ({
        index: i,
        playerId: m.playerId,
        nickname: m.nickname,
        emoji: m.emoji,
        roll: this.preRolls.get(m.playerId) ?? 0,
      })),
    });

    // 按新顺序创建 Player 列表，延迟 4s 让所有人看清排名再开局
    setTimeout(() => {
      const players = sorted.map((m) => new Player(m.playerId, m.nickname, m.emoji));
      this.state = new GameState(this.id, players);
      this.turnManager = new TurnManager(this.state, this.broadcast);
      this.phase = "playing";

      this.broadcast("game_starting", { countdown: 3 });
      this.broadcast("state_sync", { state: this.state.toFullState() });
      this.turnManager.beginTurn();
    }, 4000);
  }

  handleAction(playerId: string, action: ActionMessage) {
    if (this.phase !== "playing" || !this.turnManager) return;
    this.turnManager.handleAction(playerId, action);
    if (this.state?.phase === "game_over") this.phase = "finished";
  }

  syncTo(socket: Socket) {
    if (this.state) {
      socket.emit("state_sync", { state: this.state.toFullState() });
      // 重连后补发当前舞台/输入状态（定向，不打扰其他玩家），避免刷新丢失骰子等舞台
      this.turnManager?.replayStageTo((event, payload) => socket.emit(event, payload));
    }
  }

  get isEmpty(): boolean {
    return this.members.every((m) => !m.connected);
  }
}
