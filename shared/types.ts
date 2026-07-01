// ── 基础 ──
export type CellType =
  | "property"
  | "station"
  | "utility"
  | "fate"
  | "fund"
  | "fun"
  | "tax"
  | "special";

export type PropertyGroup =
  | "brown"
  | "sky"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "navy"
  | "purple"
  | "gold";

export type BuildingLevel = 0 | 1 | 2 | 3 | 4 | 5; // 0=空地, 1~4=房屋, 5=酒店

export type FunCellType =
  | "lucky_wheel"
  | "arena"
  | "wish_fountain"
  | "black_market"
  | "lottery"
  | "demolition"
  | "koi_pond";

// ── 格子定义 ──
export interface CellDef {
  id: number; // 0~63
  name: string;
  type: CellType;
  group?: PropertyGroup;
  price?: number;
  funType?: FunCellType;
  emoji: string;
  gridPos: { row: number; col: number };
}

// ── 地产动态状态 ──
export interface PropertyState {
  cellId: number;
  owner: string | null; // playerId
  buildings: BuildingLevel;
  mortgaged: boolean;
}

// ── 许愿效果 ──
export interface WishEffect {
  type: "wealth" | "peace" | "luck";
}

// ── 玩家状态 ──
export interface PlayerState {
  id: string;
  nickname: string;
  emoji: string;
  cash: number;
  position: number; // 0~63
  inJail: boolean;
  jailTurns: number; // 0~3
  bankrupt: boolean;
  properties: number[];
  stations: number[];
  utilities: number[];
  getOutOfJailCards: number;
  wish: WishEffect | null;
  freeRentCard: boolean;
  connected: boolean;
}

// ── 回合阶段 ──
export type TurnPhase =
  | "waiting"
  | "jail_choice"
  | "rolling"
  | "moving"
  | "event"
  | "input_required"
  | "free_action"
  | "game_over";

// ── 卡牌 ──
export interface FateCard {
  id: number;
  description: string;
  effect: string;
  copies: number;
}

export interface FundCard {
  id: number;
  description: string;
  effect: string;
  copies: number;
}

// ── 交易 ──
export interface TradeOffer {
  id: string;
  fromId: string;
  toId: string;
  giveCash: number;
  giveProperties: number[];
  giveJailCards: number;
  wantCash: number;
  wantProperties: number[];
  wantJailCards: number;
}

// ── 租金表 ──
export interface RentTable {
  base: number;
  house1: number;
  house2: number;
  house3: number;
  house4: number;
  hotel: number;
}

export interface PropertyGroupDef {
  name: PropertyGroup;
  buildCost: number;
  color: string;
  cells: {
    id: number;
    name: string;
    price: number;
    rent: RentTable;
  }[];
}

// ── 完整游戏状态 ──
export interface GameFullState {
  roomId: string;
  players: PlayerState[];
  board: Record<number, PropertyState>;
  currentTurnIndex: number;
  turnNumber: number;
  phase: TurnPhase;
  consecutiveDoubles: number;
  housePool: number; // 初始 48
  hotelPool: number; // 初始 16
  fateDeck: number[];
  fundDeck: number[];
  fateIndex: number;
  fundIndex: number;
  lotteryPot: number;
  pendingTrade: TradeOffer | null;
}

// ── 大厅 ──
export interface PlayerInfo {
  id: string;
  nickname: string;
  emoji: string;
  ready: boolean;
}

// ── 客户端 Action ──
export type ActionType =
  | "roll_dice"
  | "buy_property"
  | "skip_buy"
  | "build_house"
  | "sell_house"
  | "mortgage"
  | "redeem"
  | "trade_offer"
  | "trade_respond"
  | "end_turn"
  | "jail_pay"
  | "jail_roll"
  | "jail_card"
  | "select_opponent"
  | "wish_choose"
  | "blackmarket_choose"
  | "demolish_choose"
  | "lottery_result"
  | "declare_bankrupt"
  | "fun_start"
  | "arena_roll";

export interface ActionMessage {
  type: ActionType;
  payload?: any;
}
