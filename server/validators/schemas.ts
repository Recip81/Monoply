import { z } from "zod";

// 大厅事件
export const createRoomSchema = z.object({
  nickname: z.string().min(1).max(12),
  emoji: z.string().min(1).max(8),
});

export const joinRoomSchema = z.object({
  roomId: z.string().min(3).max(6),
  nickname: z.string().min(1).max(12),
  emoji: z.string().min(1).max(8),
});

export const roomIdSchema = z.object({
  roomId: z.string().min(3).max(6),
});

// 游戏 action
export const actionSchema = z.object({
  type: z.enum([
    "roll_dice",
    "buy_property",
    "skip_buy",
    "build_house",
    "sell_house",
    "mortgage",
    "redeem",
    "trade_offer",
    "trade_respond",
    "end_turn",
    "jail_pay",
    "jail_roll",
    "jail_card",
    "select_opponent",
    "wish_choose",
    "blackmarket_choose",
    "demolish_choose",
    "lottery_result",
    "declare_bankrupt",
    "fun_start",
    "arena_roll",
  ]),
  payload: z.any().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
