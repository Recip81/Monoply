import { create } from "zustand";

export type StageType =
  | "dice"
  | "event"
  | "wheel"
  | "arena"
  | "wish"
  | "black_market"
  | "lottery"
  | "demolition"
  | "koi";

export interface InputRequired {
  type: string;
  options: any;
}

export interface ToastItem {
  id: number;
  message: string;
  kind: "info" | "success" | "warn" | "error";
}

export interface LogItem {
  id: number;
  message: string;
  kind: "info" | "success" | "warn" | "error";
}

// 金币飘字（绑定到玩家卡片，按 playerId 定位）
export interface CoinItem {
  id: number;
  playerId: string;
  amount: number;
}

// 棋子移动动画事件
export interface MoveAnim {
  playerId: string;
  from: number;
  to: number;
  path: number[];
  seq: number; // 单调递增，标记每次移动；前端据此判断是否新移动，避免重放
}

interface UiStore {
  // 舞台
  stageVisible: boolean;
  stageType: StageType | null;
  stageContent: any;

  // 骰子展示
  diceValues: [number, number] | null;
  diceDouble: boolean;

  // 输入等待
  inputRequired: InputRequired | null;

  // 弹窗
  selectedCell: number | null;
  tradePanelOpen: boolean;
  tradeTarget: string | null;
  managePanelOpen: boolean;

  // 动画
  moveAnim: MoveAnim | null;

  // 通知
  toasts: ToastItem[];

  // 事件记录
  eventLog: LogItem[];

  // 开局掷骰定顺序
  preRollPlayers: { id: string; nickname: string; emoji: string }[] | null;

  // 游戏结束计分
  gameOver: { winnerId: string | null; scores: any[] } | null;

  // 金币飘字
  coins: CoinItem[];

  showStage: (type: StageType, content?: any) => void;
  hideStage: () => void;
  mergeStageContent: (partial: any) => void;
  setDice: (values: [number, number], double: boolean) => void;
  clearDice: () => void;
  requireInput: (type: string, options: any) => void;
  clearInput: () => void;
  openPropertyDetail: (cellId: number) => void;
  closePropertyDetail: () => void;
  openTrade: (target: string | null) => void;
  closeTrade: () => void;
  openManage: () => void;
  closeManage: () => void;
  setMoveAnim: (anim: Omit<MoveAnim, "seq"> | null) => void;
  pushToast: (message: string, kind?: ToastItem["kind"]) => void;
  removeToast: (id: number) => void;
  pushLog: (message: string) => void;
  showGameOver: (winnerId: string | null, scores: any[]) => void;
  closeGameOver: () => void;
  pushCoin: (playerId: string, amount: number) => void;
  removeCoin: (id: number) => void;
}

let toastId = 0;
let moveSeq = 0;

export const useUiStore = create<UiStore>((set) => ({
  stageVisible: false,
  stageType: null,
  stageContent: null,
  diceValues: null,
  diceDouble: false,
  inputRequired: null,
  selectedCell: null,
  tradePanelOpen: false,
  tradeTarget: null,
  managePanelOpen: false,
  moveAnim: null,
  toasts: [],
  eventLog: [],
  gameOver: null,
  preRollPlayers: null,
  coins: [],

  showStage: (type, content) =>
    set({ stageVisible: true, stageType: type, stageContent: content ?? null }),
  hideStage: () => set({ stageVisible: false, stageType: null, stageContent: null }),
  mergeStageContent: (partial) =>
    set((s) => ({ stageContent: { ...(s.stageContent ?? {}), ...partial } })),

  setDice: (values, double) => set({ diceValues: values, diceDouble: double }),
  clearDice: () => set({ diceValues: null, diceDouble: false }),

  requireInput: (type, options) => set({ inputRequired: { type, options } }),
  clearInput: () => set({ inputRequired: null }),

  openPropertyDetail: (cellId) => set({ selectedCell: cellId }),
  closePropertyDetail: () => set({ selectedCell: null }),

  openTrade: (target) => set({ tradePanelOpen: true, tradeTarget: target }),
  closeTrade: () => set({ tradePanelOpen: false, tradeTarget: null }),

  openManage: () => set({ managePanelOpen: true }),
  closeManage: () => set({ managePanelOpen: false }),

  setMoveAnim: (anim) =>
    set({ moveAnim: anim ? { ...anim, seq: ++moveSeq } : null }),

  pushToast: (message, kind = "info") =>
    set((s) => ({ toasts: [...s.toasts, { id: ++toastId, message, kind }] })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  pushLog: (message) =>
    set((s) => ({
      eventLog: [...s.eventLog.slice(-60), { id: ++toastId, message, kind: "info" }],
    })),

  showGameOver: (winnerId, scores) => set({ gameOver: { winnerId, scores } }),
  closeGameOver: () => set({ gameOver: null }),

  pushCoin: (playerId, amount) =>
    set((s) => ({ coins: [...s.coins, { id: ++toastId, playerId, amount }] })),
  removeCoin: (id) => set((s) => ({ coins: s.coins.filter((c) => c.id !== id) })),
}));
