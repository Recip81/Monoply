import type { GameState } from "../GameState.js";
import { Board } from "../Board.js";
import { transferAsset } from "./Trade.js";

export interface BankruptResult {
  playerId: string;
  creditorId: string | null; // null = 欠银行
  transferredCells: number[];
  cashTransferred: number;
}

// 把破产者的全部建筑退回 pool（资产归还银行时）
function returnBuildingsToPool(state: GameState, cellId: number) {
  const slot = state.board[cellId];
  if (slot.buildings === 5) {
    state.hotelPool += 1;
  } else if (slot.buildings >= 1) {
    state.housePool += slot.buildings;
  }
  slot.buildings = 0;
}

// 玩家破产结算。
//   creditorId 非 null：全部资产（现金 + 地产 + 出狱卡）转让给债主，建筑保留转移。
//   creditorId 为 null（欠银行）：资产归还银行（owner=null、建筑退回 pool、清抵押），现金清零。
export function bankruptPlayer(
  state: GameState,
  playerId: string,
  creditorId: string | null
): BankruptResult {
  const player = state.getPlayer(playerId)!;
  const allCells = [...player.properties, ...player.stations, ...player.utilities];
  const cashTransferred = Math.max(0, player.cash);

  if (creditorId) {
    const creditor = state.getPlayer(creditorId);
    if (creditor) {
      // 现金（若为正）转给债主
      if (cashTransferred > 0) creditor.cash += cashTransferred;
      // 出狱卡转移
      creditor.getOutOfJailCards += player.getOutOfJailCards;
      // 地产转移（建筑与抵押状态保留）
      for (const cellId of [...allCells]) {
        transferAsset(state, cellId, playerId, creditorId);
      }
    }
  } else {
    // 归还银行
    for (const cellId of allCells) {
      returnBuildingsToPool(state, cellId);
      const slot = state.board[cellId];
      slot.owner = null;
      slot.mortgaged = false;
    }
  }

  // 清空破产者资产
  player.cash = 0;
  player.properties = [];
  player.stations = [];
  player.utilities = [];
  player.getOutOfJailCards = 0;
  player.wish = null;
  player.freeRentCard = false;
  player.bankrupt = true;
  player.inJail = false;

  return { playerId, creditorId, transferredCells: allCells, cashTransferred };
}

// 玩家在不卖任何资产前提下的净值（现金 + 可抵押所得 + 卖房所得），用于判断是否资不抵债。
export function liquidationValue(state: GameState, playerId: string): number {
  const player = state.getPlayer(playerId)!;
  let total = player.cash;
  const allCells = [...player.properties, ...player.stations, ...player.utilities];
  for (const cellId of allCells) {
    const cell = Board.get(cellId);
    const slot = state.board[cellId];
    const face = cell.type === "station" ? Board.stationPrice : cell.price ?? 0;
    if (!slot.mortgaged) {
      total += Math.floor((face * 0.5) / 10) * 10; // 抵押所得
    }
    // 卖房所得（buildCost 50%）
    if (slot.buildings > 0) {
      const meta = Board.getPropertyMeta(cellId);
      if (meta) total += Math.floor((meta.buildCost * 0.5) / 10) * 10 * slot.buildings;
    }
  }
  return total;
}
