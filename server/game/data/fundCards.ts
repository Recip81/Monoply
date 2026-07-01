import type { FundCard } from "@shared/types";

// 公共基金卡 18 种定义（按 copies 展开后共 20 张）。
export const fundCards: FundCard[] = [
  { id: 1, description: "银行发错获¥200", effect: "+200", copies: 1 },
  { id: 2, description: "医疗费付¥50", effect: "-50", copies: 2 },
  { id: 3, description: "出售股票获¥50", effect: "+50", copies: 2 },
  { id: 4, description: "人寿保险获¥100", effect: "+100", copies: 1 },
  { id: 5, description: "学费付¥50", effect: "-50", copies: 1 },
  { id: 6, description: "歌唱比赛获¥25", effect: "+25", copies: 1 },
  { id: 7, description: "退税获¥20", effect: "+20", copies: 2 },
  { id: 8, description: "生日快乐，每人付你¥10", effect: "birthday", copies: 1 },
  { id: 9, description: "咨询费获¥25", effect: "+25", copies: 1 },
  { id: 10, description: "街道修缮，每房¥40每酒店¥115", effect: "street_repair", copies: 2 },
  { id: 11, description: "获得出狱通行证", effect: "jail_card", copies: 1 },
  { id: 12, description: "前进到起点", effect: "go_start", copies: 1 },
  { id: 13, description: "继承¥100", effect: "+100", copies: 1 },
  { id: 14, description: "资产维修费付¥45", effect: "-45", copies: 1 },
  { id: 15, description: "直接入狱", effect: "go_jail", copies: 1 },
  { id: 16, description: "社区捐款付¥50", effect: "-50", copies: 1 },
  { id: 17, description: "小彩票获¥200", effect: "+200", copies: 1 },
  { id: 18, description: "免费租金险（下次租金免付）", effect: "free_rent", copies: 1 },
  // ── 新增：趣味基金卡 ──
  { id: 19, description: "今天是你的生日聚会，每位玩家付你¥15作为礼物", effect: "birthday_15", copies: 1 },
  { id: 20, description: "上个月医保报销到账，获¥80", effect: "+80", copies: 2 },
  { id: 21, description: "为新建社区图书馆捐款，付¥60", effect: "-60", copies: 2 },
  { id: 22, description: "你的院落被评为社区最整洁，获¥30 + 1张出狱通行证", effect: "+30_jail_card", copies: 1 },
  { id: 23, description: "远房亲戚留给你一笔神秘遗产，获¥250", effect: "+250", copies: 1 },
  { id: 24, description: "你在地上捡到一串银行保险箱钥匙，获出狱通行证×1", effect: "jail_card", copies: 2 },
  { id: 25, description: "你抽中了美食节免单券，下次租金免付", effect: "free_rent", copies: 1 },
  { id: 26, description: "环球旅行归来，旅途中收藏的艺术品拍卖获¥180", effect: "+180", copies: 1 },
];

export const fundCardMap = new Map<number, FundCard>(
  fundCards.map((c) => [c.id, c])
);
