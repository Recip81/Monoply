import type { CellDef } from "@shared/types";

// 64 格棋盘，每边 16 格（含起始角），17×17 网格外圈铺满。
// 四角：#0 起点(左下)、#16 监狱/探访(右下)、#32 免费停车(右上)、#48 入狱(左上)。
// 网格坐标 (row, col)，row 0 在顶部，col 0 在左侧，范围 0~16。

function bottomRow(): { row: number; col: number }[] {
  // #0~#15：row=16, col 从 0 到 15（左下角向右）
  const arr: { row: number; col: number }[] = [];
  for (let i = 0; i < 16; i++) arr.push({ row: 16, col: i });
  return arr;
}
function rightCol(): { row: number; col: number }[] {
  // #16~#31：col=16, row 从 16 到 1（右下角向上）
  const arr: { row: number; col: number }[] = [];
  for (let i = 0; i < 16; i++) arr.push({ row: 16 - i, col: 16 });
  return arr;
}
function topRow(): { row: number; col: number }[] {
  // #32~#47：row=0, col 从 16 到 1（右上角向左）
  const arr: { row: number; col: number }[] = [];
  for (let i = 0; i < 16; i++) arr.push({ row: 0, col: 16 - i });
  return arr;
}
function leftCol(): { row: number; col: number }[] {
  // #48~#63：col=0, row 从 0 到 15（左上角向下回到起点上方）
  const arr: { row: number; col: number }[] = [];
  for (let i = 0; i < 16; i++) arr.push({ row: i, col: 0 });
  return arr;
}

const gridPositions = [
  ...bottomRow(),
  ...rightCol(),
  ...topRow(),
  ...leftCol(),
];

interface RawCell {
  name: string;
  type: CellDef["type"];
  group?: CellDef["group"];
  price?: number;
  funType?: CellDef["funType"];
  emoji: string;
}

const raw: RawCell[] = [
  // ── 底边 #0~#15 ──
  { name: "起点", type: "special", emoji: "🏁" },
  { name: "拉萨", type: "property", group: "brown", price: 60, emoji: "🏔️" },
  { name: "公共基金", type: "fund", emoji: "🏦" },
  { name: "银川", type: "property", group: "brown", price: 60, emoji: "🕌" },
  { name: "西宁", type: "property", group: "brown", price: 60, emoji: "🐂" },
  { name: "所得税", type: "tax", emoji: "💰" },
  { name: "命运", type: "fate", emoji: "❓" },
  { name: "南站", type: "station", price: 200, emoji: "🚄" },
  { name: "幸运转盘", type: "fun", funType: "lucky_wheel", emoji: "🎡" },
  { name: "桂林", type: "property", group: "sky", price: 100, emoji: "🏞️" },
  { name: "贵阳", type: "property", group: "sky", price: 100, emoji: "🌉" },
  { name: "海口", type: "property", group: "sky", price: 120, emoji: "🏝️" },
  { name: "电力公司", type: "utility", price: 150, emoji: "⚡" },
  { name: "苏州", type: "property", group: "pink", price: 140, emoji: "🏡" },
  { name: "扬州", type: "property", group: "pink", price: 140, emoji: "🌸" },
  { name: "天津", type: "property", group: "pink", price: 160, emoji: "⚓" },
  // ── 右边 #16~#31 ──
  { name: "监狱/探访", type: "special", emoji: "🚔" },
  { name: "擂台挑战", type: "fun", funType: "arena", emoji: "⚔️" },
  { name: "泉州", type: "property", group: "pink", price: 160, emoji: "⛵" },
  { name: "洛阳", type: "property", group: "orange", price: 180, emoji: "🏯" },
  { name: "公共基金", type: "fund", emoji: "🏦" },
  { name: "开封", type: "property", group: "orange", price: 180, emoji: "🗿" },
  { name: "大同", type: "property", group: "orange", price: 200, emoji: "🏰" },
  { name: "西站", type: "station", price: 200, emoji: "🚄" },
  { name: "命运", type: "fate", emoji: "❓" },
  { name: "武汉", type: "property", group: "red", price: 220, emoji: "🌅" },
  { name: "许愿喷泉", type: "fun", funType: "wish_fountain", emoji: "⛲" },
  { name: "长沙", type: "property", group: "red", price: 220, emoji: "🌶️" },
  { name: "重庆", type: "property", group: "red", price: 240, emoji: "🏮" },
  { name: "沈阳", type: "property", group: "yellow", price: 260, emoji: "❄️" },
  { name: "大连", type: "property", group: "yellow", price: 260, emoji: "⚓" },
  { name: "昆明", type: "property", group: "yellow", price: 280, emoji: "🌺" },
  // ── 顶边 #32~#47 ──
  { name: "免费停车", type: "special", emoji: "🅿️" },
  { name: "青岛", type: "property", group: "yellow", price: 280, emoji: "🍺" },
  { name: "自来水公司", type: "utility", price: 150, emoji: "💧" },
  { name: "黑市商人", type: "fun", funType: "black_market", emoji: "🎭" },
  { name: "南京", type: "property", group: "green", price: 300, emoji: "🌳" },
  { name: "公共基金", type: "fund", emoji: "🏦" },
  { name: "杭州", type: "property", group: "green", price: 300, emoji: "🌊" },
  { name: "北站", type: "station", price: 200, emoji: "🚄" },
  { name: "成都", type: "property", group: "green", price: 320, emoji: "🐼" },
  { name: "广州", type: "property", group: "navy", price: 350, emoji: "🌆" },
  { name: "命运", type: "fate", emoji: "❓" },
  { name: "厦门", type: "property", group: "navy", price: 350, emoji: "🏖️" },
  { name: "社区彩票", type: "fun", funType: "lottery", emoji: "🎰" },
  { name: "深圳", type: "property", group: "navy", price: 400, emoji: "💎" },
  { name: "奢侈税", type: "tax", emoji: "💰" },
  { name: "福州", type: "property", group: "navy", price: 400, emoji: "🌉" },
  // ── 左边 #48~#63 ──
  { name: "入狱", type: "special", emoji: "🔒" },
  { name: "西安", type: "property", group: "purple", price: 380, emoji: "🏛️" },
  { name: "公共基金", type: "fund", emoji: "🏦" },
  { name: "合肥", type: "property", group: "purple", price: 400, emoji: "🏭" },
  { name: "命运", type: "fate", emoji: "❓" },
  { name: "拆迁办", type: "fun", funType: "demolition", emoji: "🏗️" },
  { name: "哈尔滨", type: "property", group: "purple", price: 420, emoji: "🌨️" },
  { name: "东站", type: "station", price: 200, emoji: "🚄" },
  { name: "天然气公司", type: "utility", price: 200, emoji: "🔥" },
  { name: "北京", type: "property", group: "gold", price: 460, emoji: "🏛️" },
  { name: "上海", type: "property", group: "gold", price: 480, emoji: "🌃" },
  { name: "香港", type: "property", group: "gold", price: 520, emoji: "🦁" },
  { name: "命运", type: "fate", emoji: "❓" },
  { name: "锦鲤池", type: "fun", funType: "koi_pond", emoji: "🐟" },
  { name: "资产税", type: "tax", emoji: "💰" },
  { name: "济南", type: "property", group: "gold", price: 540, emoji: "🏯" },
];

export const mapData: CellDef[] = raw.map((c, id) => ({
  id,
  name: c.name,
  type: c.type,
  group: c.group,
  price: c.price,
  funType: c.funType,
  emoji: c.emoji,
  gridPos: gridPositions[id],
}));

export const CELL_COUNT = mapData.length; // 64
