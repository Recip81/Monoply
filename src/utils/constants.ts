import type { PropertyGroup } from "@shared/types";

export const SERVER_URL = import.meta.env.DEV ? "" : "";

// 地产组颜色（与设计文档色彩系统一致）
export const GROUP_COLORS: Record<PropertyGroup, string> = {
  brown: "#8B4513",
  sky: "#87CEEB",
  pink: "#FF69B4",
  orange: "#FF8C42",
  red: "#E74C3C",
  yellow: "#F1C40F",
  green: "#2ECC71",
  navy: "#2C3E80",
  purple: "#8E44AD",
  gold: "#DAA520",
};

// 玩家棋子可选 emoji
export const PLAYER_EMOJIS = [
  "🐶", "🐱", "🐯", "🦊", "🐼", "🐵",
  "🐸", "🐧", "🦁", "🐰", "🐨", "🦄",
];

export const START_CASH = 1800;
export const CELL_COUNT = 64;

// 玩家棋子颜色（按入座顺序分配，最多 6 人）
export const PLAYER_COLORS = [
  "#E74C3C", // 红
  "#3498DB", // 蓝
  "#2ECC71", // 绿
  "#F1C40F", // 黄
  "#9B59B6", // 紫
  "#E67E22", // 橙
];

// 各地产组建造成本（与服务端 propertyData buildCost 一致）
export const BUILD_COST: Record<PropertyGroup, number> = {
  brown: 50,
  sky: 50,
  pink: 100,
  orange: 100,
  red: 150,
  yellow: 150,
  green: 200,
  navy: 200,
  purple: 200,
  gold: 250,
};

// 本地存储键（重连用）
export const STORAGE_KEY = "monopoly_session";
