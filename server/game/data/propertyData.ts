import type { PropertyGroupDef } from "@shared/types";

export const propertyData: PropertyGroupDef[] = [
  {
    name: "brown",
    buildCost: 50,
    color: "#8B4513",
    cells: [
      { id: 1, name: "拉萨", price: 60, rent: { base: 2, house1: 10, house2: 30, house3: 90, house4: 160, hotel: 250 } },
      { id: 3, name: "银川", price: 60, rent: { base: 4, house1: 20, house2: 60, house3: 180, house4: 320, hotel: 450 } },
      { id: 4, name: "西宁", price: 60, rent: { base: 4, house1: 20, house2: 60, house3: 180, house4: 320, hotel: 450 } },
    ],
  },
  {
    name: "sky",
    buildCost: 50,
    color: "#87CEEB",
    cells: [
      { id: 9, name: "桂林", price: 100, rent: { base: 6, house1: 30, house2: 90, house3: 270, house4: 400, hotel: 550 } },
      { id: 10, name: "贵阳", price: 100, rent: { base: 6, house1: 30, house2: 90, house3: 270, house4: 400, hotel: 550 } },
      { id: 11, name: "海口", price: 120, rent: { base: 8, house1: 40, house2: 100, house3: 300, house4: 450, hotel: 600 } },
    ],
  },
  {
    name: "pink",
    buildCost: 100,
    color: "#FF69B4",
    cells: [
      { id: 13, name: "苏州", price: 140, rent: { base: 10, house1: 50, house2: 150, house3: 450, house4: 625, hotel: 750 } },
      { id: 14, name: "扬州", price: 140, rent: { base: 10, house1: 50, house2: 150, house3: 450, house4: 625, hotel: 750 } },
      { id: 15, name: "天津", price: 160, rent: { base: 12, house1: 60, house2: 180, house3: 500, house4: 700, hotel: 900 } },
      { id: 18, name: "泉州", price: 160, rent: { base: 12, house1: 60, house2: 180, house3: 500, house4: 700, hotel: 900 } },
    ],
  },
  {
    name: "orange",
    buildCost: 100,
    color: "#FF8C42",
    cells: [
      { id: 19, name: "洛阳", price: 180, rent: { base: 14, house1: 70, house2: 200, house3: 550, house4: 750, hotel: 950 } },
      { id: 21, name: "开封", price: 180, rent: { base: 14, house1: 70, house2: 200, house3: 550, house4: 750, hotel: 950 } },
      { id: 22, name: "大同", price: 200, rent: { base: 16, house1: 80, house2: 220, house3: 600, house4: 800, hotel: 1000 } },
    ],
  },
  {
    name: "red",
    buildCost: 150,
    color: "#E74C3C",
    cells: [
      { id: 25, name: "武汉", price: 220, rent: { base: 18, house1: 90, house2: 250, house3: 700, house4: 875, hotel: 1050 } },
      { id: 27, name: "长沙", price: 220, rent: { base: 18, house1: 90, house2: 250, house3: 700, house4: 875, hotel: 1050 } },
      { id: 28, name: "重庆", price: 240, rent: { base: 20, house1: 100, house2: 300, house3: 750, house4: 925, hotel: 1100 } },
    ],
  },
  {
    name: "yellow",
    buildCost: 150,
    color: "#F1C40F",
    cells: [
      { id: 29, name: "沈阳", price: 260, rent: { base: 22, house1: 110, house2: 330, house3: 800, house4: 975, hotel: 1150 } },
      { id: 30, name: "大连", price: 260, rent: { base: 22, house1: 110, house2: 330, house3: 800, house4: 975, hotel: 1150 } },
      { id: 31, name: "昆明", price: 280, rent: { base: 24, house1: 120, house2: 360, house3: 850, house4: 1025, hotel: 1200 } },
      { id: 33, name: "青岛", price: 280, rent: { base: 24, house1: 120, house2: 360, house3: 850, house4: 1025, hotel: 1200 } },
    ],
  },
  {
    name: "green",
    buildCost: 200,
    color: "#2ECC71",
    cells: [
      { id: 36, name: "南京", price: 300, rent: { base: 26, house1: 130, house2: 390, house3: 900, house4: 1100, hotel: 1275 } },
      { id: 38, name: "杭州", price: 300, rent: { base: 26, house1: 130, house2: 390, house3: 900, house4: 1100, hotel: 1275 } },
      { id: 40, name: "成都", price: 320, rent: { base: 28, house1: 150, house2: 450, house3: 1000, house4: 1200, hotel: 1400 } },
    ],
  },
  {
    name: "navy",
    buildCost: 200,
    color: "#2C3E80",
    cells: [
      { id: 41, name: "广州", price: 350, rent: { base: 35, house1: 175, house2: 500, house3: 1100, house4: 1300, hotel: 1500 } },
      { id: 43, name: "厦门", price: 350, rent: { base: 35, house1: 175, house2: 500, house3: 1100, house4: 1300, hotel: 1500 } },
      { id: 45, name: "深圳", price: 400, rent: { base: 50, house1: 200, house2: 600, house3: 1400, house4: 1700, hotel: 2000 } },
      { id: 47, name: "福州", price: 400, rent: { base: 50, house1: 200, house2: 600, house3: 1400, house4: 1700, hotel: 2000 } },
    ],
  },
  {
    name: "purple",
    buildCost: 200,
    color: "#8E44AD",
    cells: [
      { id: 49, name: "西安", price: 380, rent: { base: 38, house1: 190, house2: 550, house3: 1200, house4: 1500, hotel: 1800 } },
      { id: 51, name: "合肥", price: 400, rent: { base: 40, house1: 200, house2: 600, house3: 1300, house4: 1600, hotel: 1900 } },
      { id: 54, name: "哈尔滨", price: 420, rent: { base: 42, house1: 210, house2: 630, house3: 1400, house4: 1700, hotel: 2000 } },
    ],
  },
  {
    name: "gold",
    buildCost: 250,
    color: "#DAA520",
    cells: [
      { id: 57, name: "北京", price: 460, rent: { base: 46, house1: 230, house2: 700, house3: 1500, house4: 1800, hotel: 2100 } },
      { id: 58, name: "上海", price: 480, rent: { base: 48, house1: 240, house2: 720, house3: 1550, house4: 1850, hotel: 2200 } },
      { id: 59, name: "香港", price: 520, rent: { base: 52, house1: 260, house2: 780, house3: 1700, house4: 2000, hotel: 2400 } },
      { id: 63, name: "济南", price: 540, rent: { base: 55, house1: 275, house2: 825, house3: 1800, house4: 2100, hotel: 2500 } },
    ],
  },
];

// 便捷查询：cellId → { group, rent, price, buildCost, color }
export interface PropertyMeta {
  cellId: number;
  name: string;
  group: PropertyGroupDef["name"];
  price: number;
  rent: PropertyGroupDef["cells"][number]["rent"];
  buildCost: number;
  color: string;
}

const metaMap = new Map<number, PropertyMeta>();
for (const g of propertyData) {
  for (const c of g.cells) {
    metaMap.set(c.id, {
      cellId: c.id,
      name: c.name,
      group: g.name,
      price: c.price,
      rent: c.rent,
      buildCost: g.buildCost,
      color: g.color,
    });
  }
}

export function getPropertyMeta(cellId: number): PropertyMeta | undefined {
  return metaMap.get(cellId);
}

export function getGroupCells(group: PropertyGroupDef["name"]): number[] {
  const g = propertyData.find((x) => x.name === group);
  return g ? g.cells.map((c) => c.id) : [];
}
