# Phase 1 · 核心可玩

> 中国城市大富翁 · 60 格 · 2~6 人 · 远程联机 · 真 3D 棋盘
> 技术栈：React 18 + TypeScript + React Three Fiber + Socket.IO

本阶段目标：搭出可运行的最小闭环——能建房间、进 3D 棋盘、轮流掷骰移动、买地缴租。
本文件同时承载**全项目共享基础**（技术栈 / 项目结构 / 类型 / 视觉规范 / 地图数据 / Socket 协议 / 服务端状态 / Store / 3D 组件），后续 Phase 2~4 会引用本文件。

---

## Phase 1 交付清单

- 大厅：创建/加入房间，等待室（房主 ≥2 人可开始）
- 3D 棋盘渲染（木桌 + 棋盘 + 60 格文字）
- 棋子显示和移动动画
- 掷骰子（第一幕舞台）
- 移动（第二幕动画）
- 地产购买/缴租（第三幕基础）
- 回合制轮转
- 基本侧边栏玩家卡片

---

## 一、技术栈

**前端**
- 框架：React 18 + TypeScript
- 3D 渲染：React Three Fiber (@react-three/fiber) + @react-three/drei + @react-three/postprocessing
- 状态管理：Zustand
- 通信：Socket.IO Client
- 样式：Tailwind CSS
- 动画（2D UI）：Framer Motion
- 构建工具：Vite

**后端**
- 运行时：Node.js 18+ + TypeScript
- 通信：Socket.IO Server
- HTTP：Express（配合 Socket.IO）
- 验证：Zod（客户端数据验证）
- 运行：tsx 开发 / tsc + node 生产

**启动方式**
- 开发：`npm run dev`（前后端同时启动，Vite + tsx watch）
- 生产：`npm run build && npm start`

---

## 二、项目结构

```
monopoly/
├── package.json
├── tsconfig.json                ← 前端 TS 配置
├── tsconfig.server.json         ← 后端 TS 配置
├── vite.config.ts
├── tailwind.config.ts
├── server/
│   ├── index.ts                 ← 入口：HTTP + Socket.IO 启动
│   ├── rooms/
│   │   ├── RoomManager.ts       ← 房间生命周期管理
│   │   └── GameRoom.ts          ← 单房间实例，持有 GameState
│   ├── game/
│   │   ├── GameState.ts         ← 完整游戏状态对象 + 方法
│   │   ├── Player.ts            ← 玩家类
│   │   ├── Board.ts             ← 60 格地图定义 + 查询
│   │   ├── Property.ts          ← 地产类（租金、建筑、抵押）
│   │   ├── TurnManager.ts       ← 回合流程状态机
│   │   ├── Dice.ts              ← 骰子逻辑
│   │   ├── CardDeck.ts          ← 命运/公共基金卡组（洗牌、抽牌）
│   │   ├── actions/
│   │   │   ├── RollDice.ts      ← 掷骰 + 双骰检测 + 入狱
│   │   │   ├── MovePlayer.ts    ← 移动 + 经过起点检测
│   │   │   ├── BuyProperty.ts   ← 购买地产
│   │   │   ├── PayRent.ts       ← 缴租
│   │   │   ├── BuildHouse.ts    ← 建房/建酒店
│   │   │   ├── SellHouse.ts     ← 卖房
│   │   │   ├── Mortgage.ts      ← 抵押/赎回
│   │   │   ├── DrawCard.ts      ← 抽命运/公共基金卡并执行
│   │   │   ├── Station.ts       ← 车站传送
│   │   │   ├── Utility.ts       ← 公用事业缴租（掷骰×倍率）
│   │   │   ├── Tax.ts           ← 税务处理
│   │   │   ├── Jail.ts          ← 入狱/出狱逻辑
│   │   │   ├── Trade.ts         ← 交易处理
│   │   │   ├── Bankrupt.ts      ← 破产判定 + 资产转移
│   │   │   └── fun/             ← 7 个趣味格
│   │   │       ├── LuckyWheel.ts
│   │   │       ├── Arena.ts
│   │   │       ├── WishFountain.ts
│   │   │       ├── BlackMarket.ts
│   │   │       ├── Lottery.ts
│   │   │       ├── Demolition.ts
│   │   │       └── KoiPond.ts
│   │   └── data/
│   │       ├── mapData.ts       ← 60 格完整定义
│   │       ├── propertyData.ts  ← 10 组地产租金表
│   │       ├── fateCards.ts     ← 命运卡 20 张
│   │       └── fundCards.ts     ← 公共基金卡 20 张
│   └── validators/
│       └── schemas.ts           ← Zod 验证 schema
│
├── src/                         ← 前端源码
│   ├── main.tsx
│   ├── App.tsx
│   ├── stores/
│   │   ├── gameStore.ts         ← 游戏状态
│   │   ├── uiStore.ts           ← UI 状态（弹窗/舞台/动画队列）
│   │   └── socketStore.ts       ← Socket 连接状态
│   ├── socket/
│   │   ├── client.ts            ← Socket.IO 客户端初始化
│   │   └── handlers.ts          ← 服务端消息 → store 更新映射
│   ├── components/
│   │   ├── Lobby/
│   │   │   ├── LobbyPage.tsx
│   │   │   ├── CreateRoom.tsx
│   │   │   ├── JoinRoom.tsx
│   │   │   └── WaitingRoom.tsx
│   │   ├── Game/
│   │   │   ├── GamePage.tsx         ← 游戏主页面
│   │   │   ├── Header.tsx           ← 顶部信息栏
│   │   │   ├── Sidebar.tsx          ← 右侧玩家卡片列表
│   │   │   ├── PlayerCard.tsx       ← 单个玩家信息卡
│   │   │   ├── ActionBar.tsx        ← 底部操作按钮
│   │   │   └── EventLog.tsx         ← 实时游戏记录
│   │   ├── Board3D/
│   │   │   ├── GameCanvas.tsx       ← R3F Canvas 入口
│   │   │   ├── Table.tsx            ← 木桌 3D 模型
│   │   │   ├── BoardMesh.tsx        ← 棋盘底板（带厚度）
│   │   │   ├── Cell.tsx             ← 单个格子 3D 组件
│   │   │   ├── Building.tsx         ← 房屋/酒店 3D
│   │   │   ├── PlayerToken.tsx      ← 棋子 3D
│   │   │   ├── CenterArea.tsx       ← 中央区域
│   │   │   ├── Effects.tsx          ← 后处理（Bloom 等）
│   │   │   └── CameraController.tsx ← 摄像机控制/动画
│   │   ├── Stage/                   ← 中央舞台 UI 覆盖层
│   │   │   ├── StageOverlay.tsx     ← 舞台容器 + 遮罩
│   │   │   ├── DiceStage.tsx        ← 第一幕：掷骰子
│   │   │   ├── EventStage.tsx       ← 第三幕：格子事件
│   │   │   ├── WheelStage.tsx       ← 幸运转盘动画
│   │   │   ├── ArenaStage.tsx       ← 擂台挑战
│   │   │   ├── WishStage.tsx        ← 许愿喷泉选择
│   │   │   ├── BlackMarketStage.tsx ← 黑市商人选择
│   │   │   ├── LotteryStage.tsx     ← 社区彩票
│   │   │   ├── DemolitionStage.tsx  ← 拆迁办选择
│   │   │   ├── KoiStage.tsx         ← 锦鲤池
│   │   │   └── InputWaiting.tsx     ← 通用等待操作组件
│   │   ├── Modals/
│   │   │   ├── PropertyDetail.tsx   ← 地产详情弹窗
│   │   │   ├── TradePanel.tsx       ← 交易面板
│   │   │   └── PropertyManage.tsx   ← 抵押/卖房管理
│   │   └── Effects2D/
│   │       ├── CoinFloat.tsx        ← 金币飞入飞出
│   │       ├── StartPass.tsx        ← 过起点特效
│   │       ├── TeleportAnim.tsx     ← 车站传送动画
│   │       └── Toast.tsx            ← 通知提示
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useGameState.ts
│   │   ├── useMyPlayer.ts
│   │   └── useAnimationQueue.ts
│   ├── three/
│   │   ├── materials.ts         ← 自定义 PBR 材质
│   │   └── utils.ts             ← 3D 工具函数
│   └── utils/
│       ├── constants.ts
│       ├── cellPositions.ts     ← 60 格在棋盘上的 3D 坐标
│       └── helpers.ts
│
├── shared/                      ← 前后端共享类型
│   └── types.ts                 ← 所有 TypeScript 类型定义
│
└── public/
    └── textures/
        ├── wood.jpg             ← 桌面木纹
        ├── board-felt.jpg       ← 棋盘表面
        └── noise.png            ← 噪点纹理
```

> 说明：上面是全项目完整结构。Phase 1 只需先落地：大厅、Board3D 基础、Dice/Move/Buy/PayRent action、TurnManager、RoomManager、GameRoom、mapData、propertyData、shared/types、三个 store。趣味格 / 卡牌 / 交易 / 破产等文件留到后续阶段。

---

## 三、共享类型定义（shared/types.ts）

所有前后端共用类型在此定义，确保一致性。

```ts
// ── 基础 ──
type CellType = "property" | "station" | "utility" | "fate" |
                "fund" | "fun" | "tax" | "special"

type PropertyGroup =
  "brown" | "sky" | "pink" | "orange" | "red" |
  "yellow" | "green" | "navy" | "purple" | "gold"

type BuildingLevel = 0 | 1 | 2 | 3 | 4 | 5   // 0=空地, 1~4=房屋, 5=酒店

type FunCellType =
  "lucky_wheel" | "arena" | "wish_fountain" |
  "black_market" | "lottery" | "demolition" | "koi_pond"

// ── 格子定义 ──
interface CellDef {
  id: number              // 0~59
  name: string
  type: CellType
  group?: PropertyGroup
  price?: number
  funType?: FunCellType
  emoji: string
  gridPos: { row: number; col: number }   // 棋盘网格坐标
}

// ── 地产状态 ──
interface PropertyState {
  cellId: number
  owner: string | null       // playerId
  buildings: BuildingLevel
  mortgaged: boolean
}

// ── 玩家状态 ──
interface PlayerState {
  id: string
  nickname: string
  emoji: string
  cash: number
  position: number           // 0~59
  inJail: boolean
  jailTurns: number          // 0~3
  bankrupt: boolean
  properties: number[]       // 拥有的地产 cellId
  stations: number[]         // 拥有的车站 cellId
  utilities: number[]        // 拥有的公用事业 cellId
  getOutOfJailCards: number
  wish: WishEffect | null
  freeRentCard: boolean
  connected: boolean         // 是否在线
}

interface WishEffect {
  type: "wealth" | "peace" | "luck"
}

// ── 游戏状态 ──
interface GameFullState {
  roomId: string
  players: PlayerState[]
  board: PropertyState[]     // 长度 60，每个格子的动态状态
  currentTurnIndex: number
  turnNumber: number
  phase: TurnPhase
  consecutiveDoubles: number
  housePool: number          // 全局剩余房屋（初始 48）
  hotelPool: number          // 全局剩余酒店（初始 16）
  fateDeck: FateCard[]
  fundDeck: FundCard[]
  fateIndex: number
  fundIndex: number
  lotteryPot: number
  pendingTrade: TradeOffer | null
}

type TurnPhase =
  "waiting" | "jail_choice" | "rolling" | "moving" |
  "event" | "input_required" | "free_action" | "game_over"

// ── 卡牌 ──
interface FateCard {
  id: number
  description: string
  effect: string             // 效果标识，服务端解析执行
  copies: number
}

interface FundCard {
  id: number
  description: string
  effect: string
  copies: number
}

// ── 交易 ──
interface TradeOffer {
  id: string
  fromId: string
  toId: string
  giveCash: number
  giveProperties: number[]
  giveJailCards: number
  wantCash: number
  wantProperties: number[]
  wantJailCards: number
}

// ── 租金表 ──
interface RentTable {
  base: number
  house1: number
  house2: number
  house3: number
  house4: number
  hotel: number
}

interface PropertyGroupDef {
  name: PropertyGroup
  buildCost: number
  color: string              // CSS 颜色
  cells: {
    id: number
    name: string
    price: number
    rent: RentTable
  }[]
}
```

> 注意：原始 prompt 中 `RentTable` / `GameFullState` 字段错位，已按上面修正版为准。

---

## 四、视觉设计规范

**风格定位**：卡通 + 层次感 + 真 3D 棋盘。可爱但不低幼，精致但不复杂，真实桌面游戏沉浸感。

**字体方案**（Google Fonts CDN，`<link>` 引入）：
- `'ZCOOL KuaiLe'` 卡通风中文标题
- `'Noto Sans SC'` wght 400~900 中文正文
- `'Fredoka'` wght 400~700 数字/金额

用法：标题/按钮 `'ZCOOL KuaiLe'`；正文 `'Noto Sans SC'`；金额 `'Fredoka'`。

**色彩系统（CSS 自定义属性）**：

```css
:root {
  /* 页面 */
  --bg: #f0e6d8;
  --surface: #fffdf8;
  /* 桌面 */
  --table: #5c3d2e;
  --table-hi: #7a5542;
  --table-lo: #3d2518;
  /* 棋盘 */
  --board: #f5ede0;
  --board-rim: #8b7355;
  --board-deep: #6b5940;
  /* 地产组 10 色 */
  --c-brown:  #8B4513;
  --c-sky:    #87CEEB;
  --c-pink:   #FF69B4;
  --c-orange: #FF8C42;
  --c-red:    #E74C3C;
  --c-yellow: #F1C40F;
  --c-green:  #2ECC71;
  --c-navy:   #2C3E80;
  --c-purple: #8E44AD;
  --c-gold:   #DAA520;
  /* 功能色 */
  --accent: #ff8c42;
  --accent-d: #e07030;
  --mint: #3ecfcf;
  --coin: #ffd93d;
  --coin-d: #e6b800;
  /* 文字 */
  --txt: #2d2b55;
  --txt2: #5a5780;
  --txt3: #9490b0;
}
```

**阴影体系（层次感核心）**：所有 2D UI 卡片/按钮用多层阴影。
- 硬阴影：`box-shadow: 0 4px 0 rgba(0,0,0,.05)`（模拟厚度）
- 柔阴影：`0 6px 16px rgba(0,0,0,.06)`（环境光）
- 按钮按下：`top` 值增大 + 硬阴影高度减小

**3D 场景规范（R3F）**：
- Canvas：`shadows`，`camera={{ position:[0,12,10], fov:45 }}`，`gl={{ antialias:true, toneMapping: ACESFilmicToneMapping }}`
- 灯光：`ambientLight intensity={0.5}` + `directionalLight position={[8,15,8]} castShadow shadow-mapSize={[2048,2048]}` + drei `Environment preset="apartment"`
- 木桌：BoxGeometry + 木纹 map，roughness 0.7 / metalness 0.05，底部 `ContactShadows`
- 棋盘：BoxGeometry（带 3px 厚度）+ 棋盘纹理，roughness 0.9 / metalness 0
- 格子：薄 BoxGeometry，按类型着色，顶部色条=地产组色，hover：y 微弹 + emissive 发光
- 摄像机：`OrbitControls enablePan={false} maxPolarAngle={Math.PI/2.5} minDistance={8} maxDistance={20} enableDamping`，回合切换 useFrame + lerp 飞向当前玩家
- 后处理：Bloom + Vignette

**2D UI 叠加层**：div + Tailwind + Framer Motion，`position: absolute/fixed` 叠在 Canvas 上，用 `pointer-events-none/auto` 控制穿透。

**入场动画**：格子 stagger 30ms 从下方弹入；建筑 stagger 100ms 缩放弹入；棋子 stagger 150ms 出现。

**响应式**：`< 960px` 单栏，侧边栏折叠到底部，Header 精简。

---

## 五、页面布局

**大厅页面**：居中卡片式，三标签页（创建房间 / 加入房间 / 等待室）。
- 创建房间：输入昵称 + 选择棋子 emoji（网格选择器）
- 加入房间：输入房间号 + 昵称 + 选择 emoji
- 等待室：已加入玩家列表（头像+昵称+就绪状态）；房主显示"开始游戏"（≥2 人可开始）

**游戏主页面**：上方 Header + 中间主区域（内分左右）。

```
┌───────────────────────────────────────────────────┐
│  Header: Logo | 房间号 | 回合#N | 当前玩家 | 功能   │
├─────────────────────────────────────┬─────────────┤
│                                     │  玩家卡片 1  │
│       R3F Canvas                    │  玩家卡片 2  │
│       (3D 棋盘 + 木桌)              │  玩家卡片 3  │
│       Stage Overlay                 │  ...        │
│       (舞台 UI 覆盖在中央)           │  操作面板    │
│                                     │  游戏记录    │
├─────────────────────────────────────┤             │
│  ActionBar: 出牌|购买|建房|交易|结束  │             │
└─────────────────────────────────────┴─────────────┘
```

Canvas 区域占 `flex-1`，右侧栏固定 300px。

---

## 六、60 格地图数据（mapData.ts）

棋盘为正方形，60 格顺时针排列在四条边，每边 15 格（含两端角落）。
布局：用 17×17 网格（每边含角 17 个位），角落 (1,1)(1,17)(17,17)(17,1)，中间 15×15 为中央舞台区；或用 JS 计算每格 x/z 百分比坐标存入 `cellPositions.ts`（推荐）。

完整 CellDef[]（60 项）：

```
--- 底边 #0~#14（左→右）---
{ id:0,  name:"起点",     type:"special",  emoji:"🏁" }
{ id:1,  name:"拉萨",     type:"property", group:"brown",  price:60,  emoji:"🏔️" }
{ id:2,  name:"公共基金", type:"fund",     emoji:"🏦" }
{ id:3,  name:"银川",     type:"property", group:"brown",  price:60,  emoji:"🕌" }
{ id:4,  name:"西宁",     type:"property", group:"brown",  price:60,  emoji:"🐂" }
{ id:5,  name:"所得税",   type:"tax",      emoji:"💰" }
{ id:6,  name:"命运",     type:"fate",     emoji:"❓" }
{ id:7,  name:"南站",     type:"station",  price:200, emoji:"🚄" }
{ id:8,  name:"幸运转盘", type:"fun",      funType:"lucky_wheel", emoji:"🎡" }
{ id:9,  name:"桂林",     type:"property", group:"sky",    price:100, emoji:"🏞️" }
{ id:10, name:"贵阳",     type:"property", group:"sky",    price:100, emoji:"🌉" }
{ id:11, name:"海口",     type:"property", group:"sky",    price:120, emoji:"🏝️" }
{ id:12, name:"电力公司", type:"utility",  price:150, emoji:"⚡" }
{ id:13, name:"苏州",     type:"property", group:"pink",   price:140, emoji:"🏡" }
{ id:14, name:"扬州",     type:"property", group:"pink",   price:140, emoji:"🌸" }

--- 右边上行 #15~#29 ---
{ id:15, name:"监狱/探访", type:"special", emoji:"🚔" }
{ id:16, name:"擂台挑战", type:"fun",      funType:"arena", emoji:"⚔️" }
{ id:17, name:"泉州",     type:"property", group:"pink",   price:160, emoji:"⛵" }
{ id:18, name:"洛阳",     type:"property", group:"orange", price:180, emoji:"🏯" }
{ id:19, name:"公共基金", type:"fund",     emoji:"🏦" }
{ id:20, name:"开封",     type:"property", group:"orange", price:180, emoji:"🗿" }
{ id:21, name:"大同",     type:"property", group:"orange", price:200, emoji:"🏰" }
{ id:22, name:"西站",     type:"station",  price:200, emoji:"🚄" }
{ id:23, name:"命运",     type:"fate",     emoji:"❓" }
{ id:24, name:"武汉",     type:"property", group:"red",    price:220, emoji:"🌅" }
{ id:25, name:"许愿喷泉", type:"fun",      funType:"wish_fountain", emoji:"⛲" }
{ id:26, name:"长沙",     type:"property", group:"red",    price:220, emoji:"🌶️" }
{ id:27, name:"重庆",     type:"property", group:"red",    price:240, emoji:"🏮" }
{ id:28, name:"沈阳",     type:"property", group:"yellow", price:260, emoji:"❄️" }
{ id:29, name:"大连",     type:"property", group:"yellow", price:260, emoji:"⚓" }

--- 顶边 #30~#44（右→左）---
{ id:30, name:"免费停车", type:"special",  emoji:"🅿️" }
{ id:31, name:"青岛",     type:"property", group:"yellow", price:280, emoji:"🍺" }
{ id:32, name:"自来水公司", type:"utility", price:150, emoji:"💧" }
{ id:33, name:"黑市商人", type:"fun",      funType:"black_market", emoji:"🎭" }
{ id:34, name:"南京",     type:"property", group:"green",  price:300, emoji:"🌳" }
{ id:35, name:"公共基金", type:"fund",     emoji:"🏦" }
{ id:36, name:"杭州",     type:"property", group:"green",  price:300, emoji:"🌊" }
{ id:37, name:"北站",     type:"station",  price:200, emoji:"🚄" }
{ id:38, name:"成都",     type:"property", group:"green",  price:320, emoji:"🐼" }
{ id:39, name:"广州",     type:"property", group:"navy",   price:350, emoji:"🌆" }
{ id:40, name:"命运",     type:"fate",     emoji:"❓" }
{ id:41, name:"厦门",     type:"property", group:"navy",   price:350, emoji:"🏖️" }
{ id:42, name:"社区彩票", type:"fun",      funType:"lottery", emoji:"🎰" }
{ id:43, name:"深圳",     type:"property", group:"navy",   price:400, emoji:"💎" }
{ id:44, name:"奢侈税",   type:"tax",      emoji:"💰" }

--- 左边下行 #45~#59 ---
{ id:45, name:"入狱",     type:"special",  emoji:"🔒" }
{ id:46, name:"西安",     type:"property", group:"purple", price:380, emoji:"🏛️" }
{ id:47, name:"公共基金", type:"fund",     emoji:"🏦" }
{ id:48, name:"合肥",     type:"property", group:"purple", price:400, emoji:"🏭" }
{ id:49, name:"命运",     type:"fate",     emoji:"❓" }
{ id:50, name:"拆迁办",   type:"fun",      funType:"demolition", emoji:"🏗️" }
{ id:51, name:"哈尔滨",   type:"property", group:"purple", price:420, emoji:"🌨️" }
{ id:52, name:"东站",     type:"station",  price:200, emoji:"🚄" }
{ id:53, name:"天然气公司", type:"utility", price:200, emoji:"🔥" }
{ id:54, name:"北京",     type:"property", group:"gold",   price:460, emoji:"🏛️" }
{ id:55, name:"上海",     type:"property", group:"gold",   price:480, emoji:"🌃" }
{ id:56, name:"香港",     type:"property", group:"gold",   price:520, emoji:"🦁" }
{ id:57, name:"命运",     type:"fate",     emoji:"❓" }
{ id:58, name:"锦鲤池",   type:"fun",      funType:"koi_pond", emoji:"🐟" }
{ id:59, name:"资产税",   type:"tax",      emoji:"💰" }
```

---

## 七、地产系统数据（propertyData.ts）

30 块地产分 10 组，每组 3 块。完整数据可直接使用：

```ts
propertyData = [
  { name:"brown", buildCost:50, color:"#8B4513", cells:[
    { id:1,  name:"拉萨", price:60,  rent:{base:2,  house1:10, house2:30, house3:90,  house4:160, hotel:250} },
    { id:3,  name:"银川", price:60,  rent:{base:4,  house1:20, house2:60, house3:180, house4:320, hotel:450} },
    { id:4,  name:"西宁", price:60,  rent:{base:4,  house1:20, house2:60, house3:180, house4:320, hotel:450} } ]},
  { name:"sky", buildCost:50, color:"#87CEEB", cells:[
    { id:9,  name:"桂林", price:100, rent:{base:6,  house1:30, house2:90,  house3:270, house4:400, hotel:550} },
    { id:10, name:"贵阳", price:100, rent:{base:6,  house1:30, house2:90,  house3:270, house4:400, hotel:550} },
    { id:11, name:"海口", price:120, rent:{base:8,  house1:40, house2:100, house3:300, house4:450, hotel:600} } ]},
  { name:"pink", buildCost:100, color:"#FF69B4", cells:[
    { id:13, name:"苏州", price:140, rent:{base:10, house1:50, house2:150, house3:450, house4:625, hotel:750} },
    { id:14, name:"扬州", price:140, rent:{base:10, house1:50, house2:150, house3:450, house4:625, hotel:750} },
    { id:17, name:"泉州", price:160, rent:{base:12, house1:60, house2:180, house3:500, house4:700, hotel:900} } ]},
  { name:"orange", buildCost:100, color:"#FF8C42", cells:[
    { id:18, name:"洛阳", price:180, rent:{base:14, house1:70, house2:200, house3:550, house4:750, hotel:950} },
    { id:20, name:"开封", price:180, rent:{base:14, house1:70, house2:200, house3:550, house4:750, hotel:950} },
    { id:21, name:"大同", price:200, rent:{base:16, house1:80, house2:220, house3:600, house4:800, hotel:1000} } ]},
  { name:"red", buildCost:150, color:"#E74C3C", cells:[
    { id:24, name:"武汉", price:220, rent:{base:18, house1:90,  house2:250, house3:700, house4:875, hotel:1050} },
    { id:26, name:"长沙", price:220, rent:{base:18, house1:90,  house2:250, house3:700, house4:875, hotel:1050} },
    { id:27, name:"重庆", price:240, rent:{base:20, house1:100, house2:300, house3:750, house4:925, hotel:1100} } ]},
  { name:"yellow", buildCost:150, color:"#F1C40F", cells:[
    { id:28, name:"沈阳", price:260, rent:{base:22, house1:110, house2:330, house3:800, house4:975,  hotel:1150} },
    { id:29, name:"大连", price:260, rent:{base:22, house1:110, house2:330, house3:800, house4:975,  hotel:1150} },
    { id:31, name:"青岛", price:280, rent:{base:24, house1:120, house2:360, house3:850, house4:1025, hotel:1200} } ]},
  { name:"green", buildCost:200, color:"#2ECC71", cells:[
    { id:34, name:"南京", price:300, rent:{base:26, house1:130, house2:390, house3:900,  house4:1100, hotel:1275} },
    { id:36, name:"杭州", price:300, rent:{base:26, house1:130, house2:390, house3:900,  house4:1100, hotel:1275} },
    { id:38, name:"成都", price:320, rent:{base:28, house1:150, house2:450, house3:1000, house4:1200, hotel:1400} } ]},
  { name:"navy", buildCost:200, color:"#2C3E80", cells:[
    { id:39, name:"广州", price:350, rent:{base:35, house1:175, house2:500, house3:1100, house4:1300, hotel:1500} },
    { id:41, name:"厦门", price:350, rent:{base:35, house1:175, house2:500, house3:1100, house4:1300, hotel:1500} },
    { id:43, name:"深圳", price:400, rent:{base:50, house1:200, house2:600, house3:1400, house4:1700, hotel:2000} } ]},
  { name:"purple", buildCost:200, color:"#8E44AD", cells:[
    { id:46, name:"西安",   price:380, rent:{base:38, house1:190, house2:550, house3:1200, house4:1500, hotel:1800} },
    { id:48, name:"合肥",   price:400, rent:{base:40, house1:200, house2:600, house3:1300, house4:1600, hotel:1900} },
    { id:51, name:"哈尔滨", price:420, rent:{base:42, house1:210, house2:630, house3:1400, house4:1700, hotel:2000} } ]},
  { name:"gold", buildCost:250, color:"#DAA520", cells:[
    { id:54, name:"北京", price:460, rent:{base:46, house1:230, house2:700, house3:1500, house4:1800, hotel:2100} },
    { id:55, name:"上海", price:480, rent:{base:48, house1:240, house2:720, house3:1550, house4:1850, hotel:2200} },
    { id:56, name:"香港", price:520, rent:{base:52, house1:260, house2:780, house3:1700, house4:2000, hotel:2400} } ]}
]
```

> Phase 1 只用到 `price` / `rent.base`（无房裸租）和颜色。建房相关字段在 Phase 2 启用。
> 全局资源池：房屋 48 栋，酒店 16 家（Phase 2 用）。

---

## 八、骰子与移动（Phase 1 范围）

2 颗 6 面骰，点数 2~12。
- 双骰：可再掷一次
- 连续第三次双骰：直接入狱（Phase 1 可先做"入狱=送到 #45 并跳过"，完整出狱逻辑在 Phase 2）

移动：从 position 顺时针逐格前进 N 步，经过/落到 #0 起点收 ¥200。

落地基础事件（Phase 1）：
- property 无主 → 弹购买（买/不买）；有主且非自己 → 缴 `rent.base`
- 其他类型格子 Phase 1 可先"无事通过"，留到后续阶段实现

玩家初始：现金 ¥1800，position 0。

---

## 九、Socket.IO 事件协议（基础）

namespace：`/lobby`、`/game`。

**大厅事件**
```
Client→Server:
  "create_room"  { nickname, emoji }
  "join_room"    { roomId, nickname, emoji }
  "player_ready" { roomId }
  "start_game"   { roomId }
Server→Client:
  "room_created" { roomId }
  "room_joined"  { roomId, players: PlayerInfo[] }
  "room_update"  { players: PlayerInfo[], hostId }
  "game_starting"{ countdown }
```

**游戏事件 服务端→客户端**（Phase 1 必需的加粗）
```
**"state_sync"**      { state: GameFullState }   ← 完整同步（加入/重连）
**"turn_begin"**      { playerId, turnNumber }
**"stage_start"**     { stage: 1|2|3, content }
**"stage_end"**       { stage: 1|2|3 }
**"dice_result"**     { dice:[n,n], isDouble, consecutiveDoubles }
**"move_start"**      { playerId, from, to, path: number[] }
**"move_step"**       { playerId, cellId }
**"move_end"**        { playerId, cellId }
**"cash_change"**     { playerId, amount, reason }
**"property_change"** { cellId, owner?, buildings?, mortgaged? }
"need_input"          { inputType, options, timeout? }
"player_acted"        { playerId, action, detail }
"teleport"            { playerId, from, to, passedStart }   ← Phase 2
"card_drawn"          { deckType, card, playerId }          ← Phase 2
"bankrupt"            { playerId, creditorId? }             ← Phase 3
"game_over"           { winnerId, scores? }
"error"               { message }
```

**游戏事件 客户端→服务端**
```
"action" { type: ActionType, payload? }

ActionType（Phase 1 用前几个，其余后续）：
  "roll_dice"
  "buy_property"   { cellId }
  "skip_buy"
  "end_turn"
  "build_house"/"sell_house"/"mortgage"/"redeem"      ← Phase 2
  "trade_offer"/"trade_respond"                       ← Phase 3
  "jail_pay"/"jail_roll"/"jail_card"                  ← Phase 2
  "select_opponent"/"wish_choose"/"blackmarket_choose"
  /"demolish_choose"/"lottery_result"                 ← Phase 3
```

约束：服务端为权威状态源，客户端只展示和提交操作；所有 action 必须经 Zod 验证。

---

## 十、服务端游戏状态结构

`GameFullState`：
```
{
  roomId, players: PlayerState[],
  board: { [cellId]: { owner: string|null, buildings: 0..5, mortgaged: boolean } },
  currentTurnIndex, turnNumber, phase,
  consecutiveDoubles,
  housePool=48, hotelPool=16,
  fateDeck: number[], fundDeck: number[], fateIndex, fundIndex,
  lotteryPot, pendingTrade: TradeOffer|null
}
```

`PlayerState`：见第三部分类型。初始 `cash=1800, position=0, inJail=false, jailTurns=0, bankrupt=false`，各资产数组为空。

**回合流程状态机（TurnManager）**：
1. `jail_choice`（如在狱中）→ 等待出狱操作【Phase 2】
2. `rolling` → 发 stage 1，等待掷骰
3. `moving` → 计算路径，发 move 动画
4. `event` → 处理落地格，发 stage 3；如需操作 → `input_required`
5. `free_action` → 等待建房/交易/结束
6. 检查双骰 → 回到 2 或 `nextTurn()`

> Phase 1 实现 2→3→4(仅 property)→5(仅结束回合)→6，jail 简化处理。

---

## 十一、前端 Store 设计

**gameStore（Zustand）** state：`myPlayerId, players, board, currentTurnIndex, turnNumber, phase, consecutiveDoubles, housePool, hotelPool, lotteryPot, pendingTrade`。actions：`syncState, updatePlayer(id,partial), updateCell(cellId,partial), setPhase`。

**uiStore（Zustand）** state：`stageVisible, stageType(null|"dice"|"event"|"wheel"|...), stageContent, inputRequired(null|{type,options}), selectedCell, tradePanelOpen, tradeTarget, managePanelOpen, animationQueue`。actions：`showStage, hideStage, requireInput, clearInput, openPropertyDetail, closePropertyDetail`。

**socketStore（Zustand）** state：`socket, connected, roomId`。actions：`connect, disconnect, emit(type, payload)`。

---

## 十二、3D 场景组件实现指引

**GameCanvas.tsx**
```tsx
<Canvas shadows camera={{ position:[0,14,12], fov:40 }}>
  <color attach="background" args={["#f0e6d8"]} />
  <ambientLight intensity={0.5} />
  <directionalLight castShadow position={[8,15,8]}
    shadow-mapSize-width={2048} shadow-mapSize-height={2048}
    shadow-camera-far={50} shadow-camera-left={-15} shadow-camera-right={15}
    shadow-camera-top={15} shadow-camera-bottom={-15} />
  <Environment preset="apartment" />
  <ContactShadows position={[0,-0.01,0]} opacity={0.4} blur={2} />
  <Table />
  <BoardMesh>
    {cells.map(c => <Cell key={c.id} ... />)}
    {buildings.map(b => <Building key={b.cellId} ... />)}  {/* Phase 2 */}
    {players.map(p => <PlayerToken key={p.id} ... />)}
    <CenterArea />
  </BoardMesh>
  <CameraController />
  <Effects />
</Canvas>
```

**Table.tsx**：`<boxGeometry args={[14,0.3,14]} />` + 木纹 map，roughness 0.7。

**BoardMesh.tsx**：底板 `boxGeometry [12,0.15,12]` + felt 纹理，侧面厚度 mesh，`{children}`。

**Cell.tsx**：薄 box 格子面 + 顶部色条（地产组色）+ drei `Text` 显示 name 和 emoji，hover y 微弹 + emissive。

**PlayerToken.tsx**（推荐方案 B）：drei `Text` 渲染 emoji + 底部 `ringGeometry` 半透明光环；移动用 `useFrame` lerp position（每格 300ms）。

**CameraController.tsx**：`OrbitControls enablePan={false} maxPolarAngle={Math.PI/2.5} minDistance={8} maxDistance={20} enableDamping dampingFactor={0.05}`，回合切换平滑移动摄像机。

---

## 十三、中央舞台系统（Phase 1 用前两幕 + 购买）

舞台是覆盖棋盘中央的 2D div 浮层，默认隐藏，所有玩家同步看到相同内容。

**第一幕 掷骰子**：弹舞台，当前玩家头像+昵称，两颗骰子 3D 翻转动画（1.5s），大号 Fredoka 数字，双骰显示"✨ 再掷一次！"，连续三次双骰"🚨 入狱！"。展示 2~3s 自动关闭。

**第二幕 棋子移动**：关舞台，棋子逐格跳跃前进（每格 300ms lerp），所有玩家同步；经过起点闪光 + 浮动 "+¥200"。

**第三幕 格子事件**：重新弹舞台，展示落地格：上部 emoji+名称+类型，中部结果，底部三行（📋 这是什么格子 / 🎮 玩家主动做了什么 / ⚡ 被动发生了什么）。需操作的在舞台内等待（Phase 1 仅"购买地产：买/不买"）。

**舞台 UI 规范**：半透明深色遮罩 + backdrop-blur；卡片浅色 `border-radius:24px`；入场 `scale(0.92)+translateY(20px)→原位`，Framer Motion spring；内部上视觉区 + 中信息区 + 底按钮区。
```
