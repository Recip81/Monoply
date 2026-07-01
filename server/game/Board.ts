import type { CellDef, PropertyGroup, RentTable } from "@shared/types";
import { mapData, CELL_COUNT } from "./data/mapData.js";
import { propertyData } from "./data/propertyData.js";

// 地产 cellId -> { groupDef, price, rent }
interface PropertyMeta {
  group: PropertyGroup;
  buildCost: number;
  color: string;
  price: number;
  rent: RentTable;
  name: string;
}

const propertyMetaMap = new Map<number, PropertyMeta>();
for (const grp of propertyData) {
  for (const cell of grp.cells) {
    propertyMetaMap.set(cell.id, {
      group: grp.name,
      buildCost: grp.buildCost,
      color: grp.color,
      price: cell.price,
      rent: cell.rent,
      name: cell.name,
    });
  }
}

export const Board = {
  cells: mapData,
  count: CELL_COUNT,

  get(cellId: number): CellDef {
    return mapData[cellId];
  },

  getPropertyMeta(cellId: number): PropertyMeta | undefined {
    return propertyMetaMap.get(cellId);
  },

  // 该地产组的所有 cellId
  groupCells(group: PropertyGroup): number[] {
    const grp = propertyData.find((g) => g.name === group);
    return grp ? grp.cells.map((c) => c.id) : [];
  },

  isProperty(cellId: number): boolean {
    return mapData[cellId]?.type === "property";
  },
  isStation(cellId: number): boolean {
    return mapData[cellId]?.type === "station";
  },
  isUtility(cellId: number): boolean {
    return mapData[cellId]?.type === "utility";
  },

  // 站点价格固定 200
  stationPrice: 200,

  // 租金表（按拥有车站数）
  stationRent(count: number): number {
    return [0, 50, 100, 200, 400][count] ?? 0;
  },

  // 公用事业倍率（按拥有数量）
  utilityMultiplier(count: number): number {
    return [0, 4, 10, 16][count] ?? 0;
  },

  // 所有车站 cellId
  allStations(): number[] {
    return mapData.filter((c) => c.type === "station").map((c) => c.id);
  },
  allUtilities(): number[] {
    return mapData.filter((c) => c.type === "utility").map((c) => c.id);
  },

  // 按城市名查 cellId（用于命运卡「前进到某城」，避免硬编码格号随布局漂移）
  cellIdByName(name: string): number {
    const c = mapData.find((c) => c.name === name);
    return c ? c.id : 0;
  },
};
