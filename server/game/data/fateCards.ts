import type { FateCard } from "@shared/types";

// 命运卡 17 种定义（按 copies 展开后共 20 张）。
export const fateCards: FateCard[] = [
  { id: 1, description: "前进到起点，获¥200", effect: "go_start", copies: 2 },
  { id: 2, description: "前进到香港（经起点收¥200）", effect: "go_56", copies: 1 },
  { id: 3, description: "前进到桂林（经起点收¥200）", effect: "go_9", copies: 1 },
  { id: 4, description: "前进到最近车站，付双倍租金", effect: "nearest_station_2x", copies: 1 },
  { id: 5, description: "前进到最近公用事业，掷骰×10支付", effect: "nearest_utility_x10", copies: 1 },
  { id: 6, description: "银行付你¥50股息", effect: "+50", copies: 2 },
  { id: 7, description: "获得出狱通行证", effect: "jail_card", copies: 1 },
  { id: 8, description: "后退3格", effect: "back_3", copies: 1 },
  { id: 9, description: "直接入狱", effect: "go_jail", copies: 1 },
  { id: 10, description: "每栋房屋修缮¥25，每家酒店¥100", effect: "repair", copies: 2 },
  { id: 11, description: "获建筑贷款¥150", effect: "+150", copies: 1 },
  { id: 12, description: "你是董事长，付每人¥50", effect: "pay_all_50", copies: 2 },
  { id: 13, description: "猜谜大赛获¥100", effect: "+100", copies: 1 },
  { id: 14, description: "寿险到期获¥100", effect: "+100", copies: 1 },
  { id: 15, description: "学校税付¥150", effect: "-150", copies: 1 },
  { id: 16, description: "前进到上海（经起点收¥200）", effect: "go_55", copies: 1 },
  { id: 17, description: "拥有3栋以上房屋的地产，每块获¥50", effect: "houses_bonus", copies: 1 },
  // ── 新增：趣味命运卡 ──
  { id: 18, description: "一辆顺路的越野车捎上你，搭便车到昆明（经起点收¥200）", effect: "go_kunming", copies: 1 },
  { id: 19, description: "红眼航班延误8小时，航空公司赔偿¥150，后退4格", effect: "back_4_cash_150", copies: 1 },
  { id: 20, description: "出租车司机拉着你兜了一大圈，后退2格", effect: "back_2", copies: 1 },
  { id: 21, description: "你投资的科技股涨停了，获¥300", effect: "+300", copies: 1 },
  { id: 22, description: "你当选城市旅游形象大使，每位玩家付你¥40庆贺", effect: "pay_all_40_to_me", copies: 1 },
  { id: 23, description: "台风过境损坏了你的房产，每栋房屋修缮¥40，每家酒店¥150", effect: "repair_40_150", copies: 1 },
];

// id -> 卡定义
export const fateCardMap = new Map<number, FateCard>(
  fateCards.map((c) => [c.id, c])
);
