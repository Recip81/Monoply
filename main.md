我要开发一个大富翁游戏，下面是提示词，你可以将下面的提示词分成四个阶段，写进四个md文件中，然后分阶段开发
================================================================
  中国城市大富翁 · 完整开发 Prompt
  60 格 · 2~6 人 · 远程联机 · 真 3D 棋盘
  技术栈：React 18 + TypeScript + React Three Fiber + Socket.IO
================================================================

你是一位高级全栈游戏工程师。请根据以下完整设计文档，
开发一款可运行的中国城市大富翁联机游戏。

================================================================
第一部分：技术栈
================================================================

【前端】
  框架：React 18 + TypeScript
  3D 渲染：React Three Fiber (@react-three/fiber)
         + @react-three/drei（辅助工具）
         + @react-three/postprocessing（后处理）
  状态管理：Zustand
  通信：Socket.IO Client
  样式：Tailwind CSS
  动画（2D UI）：Framer Motion
  构建工具：Vite

【后端】
  运行时：Node.js 18+ + TypeScript
  通信：Socket.IO Server
  HTTP：Express（配合 Socket.IO）
  验证：Zod（客户端数据验证）
  运行：tsx 开发 / tsc + node 生产

【启动方式】
  开发：npm run dev（前后端同时启动，Vite + tsx watch）
  生产：npm run build && npm start

================================================================
第二部分：项目结构
================================================================

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

================================================================
第三部分：共享类型定义（shared/types.ts）
================================================================

所有前后端共用的类型在此定义，确保一致性：

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
  // 长度 60，每个格子的动态状态
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
 players: PlayerState[]
  board: PropertyState[]      house1: number
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

// ── Socket 事件类型 ──
// （详见第十二部分）

================================================================
第四部分：视觉设计规范
================================================================

【风格定位】
  卡通 + 层次感 + 真 3D 棋盘
  可爱但不低幼，精致但不复杂，真实桌面游戏沉浸感

【字体方案】
  Google Fonts CDN（<link> 标签引入）：
    'ZCOOL KuaiLe'            卡通风中文标题
    'Noto Sans SC' wght 400~900  中文正文
    'Fredoka' wght 400~700       数字/金额

  用法：
    标题/按钮：font-family: 'ZCOOL KuaiLe', sans-serif
    正文：    font-family: 'Noto Sans SC', sans-serif
    金额数字：font-family: 'Fredoka', sans-serif

【色彩系统 —— CSS 自定义属性】

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

【阴影体系 —— 层次感核心】
  所有 2D UI 卡片/按钮使用多层阴影：
    硬阴影：box-shadow: 0 4px 0 rgba(0,0,0,.05)   ← 模拟厚度
    柔阴影：0 6px 16px rgba(0,0,0,.06)             ← 环境光
  按钮按下：top 值增大 + 硬阴影高度减小

【3D 场景规范（React Three Fiber）】

  Canvas 配置：
    shadows={true}
    camera={{ position: [0, 12, 10], fov: 45 }}
    gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}

  灯光：
    ambientLight intensity={0.5}
    directionalLight position={[8, 15, 8]}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera 属性控制阴影范围
    Environment preset="apartment"  ← 来自 drei，提供环境反射

  木桌 (Table.tsx)：
    BoxGeometry，宽厚比模拟桌面
    MeshStandardMaterial：
      map: 木纹纹理
      roughness: 0.7
      metalness: 0.05
    底部加 ContactShadows 组件

  棋盘 (BoardMesh.tsx)：
    BoxGeometry 宽×高×厚（带 3px 厚度）
    MeshStandardMaterial：
      map: 棋盘纹理
      roughness: 0.9
      metalness: 0.0
    放在桌面上方（y 略高于桌面）

  格子 (Cell.tsx)：
    PlaneGeometry 或薄 BoxGeometry（带微厚度）
    每个格子根据类型着色
    顶部色条：细长 BoxGeometry，颜色=地产组色
    hover 效果：y 轴微弹 + 发光边缘（通过 emissive 属性）
    用 cellPositions.ts 中的坐标定位

  建筑 (Building.tsx)：
    纯 3D 几何体绘制（不用外部模型）：
    小房屋：屋顶用 ConeGeometry 或三角形，
            墙壁用 BoxGeometry，组合成 Group
    酒店：  较高的 BoxGeometry + 小窗户细节
    通过 color prop 控制颜色（来自地产组色）
    放置在格子上方，y 随建筑等级递增
    每栋建筑下方投射 ContactShadows

  棋子 (PlayerToken.tsx)：
    方案 A：SphereGeometry + 玩家颜色材质，底部发光环
    方案 B：Text 显示 emoji（drei 的 Text 组件可渲染 3D 文字）
    方案 C：加载简单 GLTF 模型（小人偶）
    推荐方案 B 或 C，视觉效果最好
    移动动画：lerp 插值，每格 300ms
    底部脉冲光环：RingGeometry + 半透明动画材质

  摄像机控制 (CameraController.tsx)：
    OrbitControls（drei）：
      enablePan={false}
      maxPolarAngle={Math.PI / 2.5}   ← 不能翻到棋盘下面
      minDistance={8}
      maxDistance={20}
      enableDamping={true}
    回合切换时自动飞向当前玩家位置（useFrame + lerp）

  后处理 (Effects.tsx)：
    Bloom（泛光）：让发光元素更突出
    Vignette（暗角）：增加氛围感

【2D UI 叠加层规范】
  舞台/弹窗/侧边栏等 2D 元素使用 div + Tailwind + Framer Motion
  叠加在 Canvas 上方（position: absolute / fixed）
  用 pointer-events-none / pointer-events-auto 控制穿透

【入场动画】
  格子：stagger 30ms 逐个从下方弹入（y: 0.5 → 0）
  建筑：stagger 100ms 逐个缩放弹入（scale: 0 → 1）
  棋子：stagger 150ms 逐个出现

【响应式】
  < 960px：单栏，侧边栏折叠到底部，Header 精简

================================================================
第五部分：页面布局
================================================================

【大厅页面】
  居中卡片式布局
  三个标签页：创建房间 / 加入房间 / 等待室
  创建房间：输入昵称 + 选择棋子 emoji（网格选择器）
  加入房间：输入房间号 + 昵称 + 选择 emoji
  等待室：已加入玩家列表（头像+昵称+就绪状态）
         房主显示"开始游戏"按钮（≥2人可开始）

【游戏主页面】
  整体布局：上方 Header + 中间主区域 + 主区域内分左右

  ┌───────────────────────────────────────────────────┐
  │  Header: Logo | 房间号 | 回合#N | 当前玩家 | 功能   │
  ├─────────────────────────────────────┬─────────────┤
  │                                     │  玩家卡片 1  │
  │       R3F Canvas                    │  玩家卡片 2  │
  │       (3D 棋盘 + 木桌)              │  玩家卡片 3  │
  │                                     │  ...        │
  │       Stage Overlay                 │             │
  │       (舞台 UI 覆盖在中央)           │  操作面板    │
  │                                     │  游戏记录    │
  ├─────────────────────────────────────┤             │
  │  ActionBar: 出牌|购买|建房|交易|结束  │             │
  └─────────────────────────────────────┴─────────────┘

  Canvas 区域占 flex-1，右侧栏固定 300px

================================================================
第六部分：60 格地图数据
================================================================

棋盘为正方形，60 格顺时针排列在四条边上，每条边 15 格（含两端角落）。

推荐布局方案：
  使用 17×17 网格（每边含角 17 个格子位）
  角落位于 (1,1) (1,17) (17,17) (17,1)
  中间 15×15 为中央舞台区域

  或用绝对定位：根据棋盘宽高用 JS 计算每个格子的
  x/z 百分比坐标（推荐），存入 cellPositions.ts。

格子定义数组（CellDef[]，共 60 项）：

--- 底边 #0~#14（左侧→右侧）---
{ id:0,  name:"起点",       type:"special",  emoji:"🏁", price:undefined }
{ id:1,  name:"拉萨",       type:"property", group:"brown",  price:60,  emoji:"🏔️" }
{ id:2,  name:"公共基金",   type:"fund",     emoji:"🏦" }
{ id:3,  name:"银川",       type:"property", group:"brown",  price:60,  emoji:"🕌" }
{ id:4,  name:"西宁",       type:"property", group:"brown",  price:60,  emoji:"🐂" }
{ id:5,  name:"所得税",     type:"tax",      emoji:"💰" }
{ id:6,  name:"命运",       type:"fate",     emoji:"❓" }
{ id:7,  name:"南站",       type:"station",  price:200, emoji:"🚄" }
{ id:8,  name:"幸运转盘",   type:"fun",      funType:"lucky_wheel", emoji:"🎡" }
{ id:9,  name:"桂林",       type:"property", group:"sky",    price:100, emoji:"🏞️" }
{ id:10, name:"贵阳",       type:"property", group:"sky",    price:100, emoji:"🌉" }
{ id:11, name:"海口",       type:"property", group:"sky",    price:120, emoji:"🏝️" }
{ id:12, name:"电力公司",   type:"utility",  price:150, emoji:"⚡" }
{ id:13, name:"苏州",       type:"property", group:"pink",   price:140, emoji:"🏡" }
{ id:14, name:"扬州",       type:"property", group:"pink",   price:140, emoji:"🌸" }

--- 右边上行 #15~#29 ---
{ id:15, name:"监狱/探访",  type:"special",  emoji:"🚔" }
{ id:16, name:"擂台挑战",   type:"fun",      funType:"arena", emoji:"⚔️" }
{ id:17, name:"泉州",       type:"property", group:"pink",   price:160, emoji:"⛵" }
{ id:18, name:"洛阳",       type:"property", group:"orange", price:180, emoji:"🏯" }
{ id:19, name:"公共基金",   type:"fund",     emoji:"🏦" }
{ id:20, name:"开封",       type:"property", group:"orange", price:180, emoji:"🗿" }
{ id:21, name:"大同",       type:"property", group:"orange", price:200, emoji:"🏰" }
{ id:22, name:"西站",       type:"station",  price:200, emoji:"🚄" }
{ id:23, name:"命运",       type:"fate",     emoji:"❓" }
{ id:24, name:"武汉",       type:"property", group:"red",    price:220, emoji:"🌅" }
{ id:25, name:"许愿喷泉",   type:"fun",      funType:"wish_fountain", emoji:"⛲" }
{ id:26, name:"长沙",       type:"property", group:"red",    price:220, emoji:"🌶️" }
{ id:27, name:"重庆",       type:"property", group:"red",    price:240, emoji:"🏮" }
{ id:28, name:"沈阳",       type:"property", group:"yellow", price:260, emoji:"❄️" }
{ id:29, name:"大连",       type:"property", group:"yellow", price:260, emoji:"⚓" }

--- 顶边 #30~#44（右侧→左侧）---
{ id:30, name:"免费停车",   type:"special",  emoji:"🅿️" }
{ id:31, name:"青岛",       type:"property", group:"yellow", price:280, emoji:"🍺" }
{ id:32, name:"自来水公司", type:"utility",  price:150, emoji:"💧" }
{ id:33, name:"黑市商人",   type:"fun",      funType:"black_market", emoji:"🎭" }
{ id:34, name:"南京",       type:"property", group:"green",  price:300, emoji:"🌳" }
{ id:35, name:"公共基金",   type:"fund",     emoji:"🏦" }
{ id:36, name:"杭州",       type:"property", group:"green",  price:300, emoji:"🌊" }
{ id:37, name:"北站",       type:"station",  price:200, emoji:"🚄" }
{ id:38, name:"成都",       type:"property", group:"green",  price:320, emoji:"🐼" }
{ id:39, name:"广州",       type:"property", group:"navy",   price:350, emoji:"🌆" }
{ id:40, name:"命运",       type:"fate",     emoji:"❓" }
{ id:41, name:"厦门",       type:"property", group:"navy",   price:350, emoji:"🏖️" }
{ id:42, name:"社区彩票",   type:"fun",      funType:"lottery", emoji:"🎰" }
{ id:43, name:"深圳",       type:"property", group:"navy",   price:400, emoji:"💎" }
{ id:44, name:"奢侈税",     type:"tax",      emoji:"💰" }

--- 左边下行 #45~#59 ---
{ id:45, name:"入狱",       type:"special",  emoji:"🔒" }
{ id:46, name:"西安",       type:"property", group:"purple", price:380, emoji:"🏛️" }
{ id:47, name:"公共基金",   type:"fund",     emoji:"🏦" }
{ id:48, name:"合肥",       type:"property", group:"purple", price:400, emoji:"🏭" }
{ id:49, name:"命运",       type:"fate",     emoji:"❓" }
{ id:50, name:"拆迁办",     type:"fun",      funType:"demolition", emoji:"🏗️" }
{ id:51, name:"哈尔滨",     type:"property", group:"purple", price:420, emoji:"🌨️" }
{ id:52, name:"东站",       type:"station",  price:200, emoji:"🚄" }
{ id:53, name:"天然气公司", type:"utility",  price:200, emoji:"🔥" }
{ id:54, name:"北京",       type:"property", group:"gold",   price:460, emoji:"🏛️" }
{ id:55, name:"上海",       type:"property", group:"gold",   price:480, emoji:"🌃" }
{ id:56, name:"香港",       type:"property", group:"gold",   price:520, emoji:"🦁" }
{ id:57, name:"命运",       type:"fate",     emoji:"❓" }
{ id:58, name:"锦鲤池",     type:"fun",      funType:"koi_pond", emoji:"🐟" }
{ id:59, name:"资产税",     type:"tax",      emoji:"💰" }

================================================================
第七部分：地产系统详细数据
================================================================

30 块地产分 10 组，每组 3 块。
完整数据（PropertyGroupDef[] 格式，可直接使用）：

propertyData = [
  {
    name: "brown", buildCost: 50,
    color: "#8B4513",
    cells: [
      { id:1,  name:"拉萨", price:60,  rent:{base:2,  house1:10,  house2:30,  house3:90,   house4:160, hotel:250} },
      { id:3,  name:"银川", price:60,  rent:{base:4,  house1:20,  house2:60,  house3:180,  house4:320, hotel:450} },
      { id:4,  name:"西宁", price:60,  rent:{base:4,  house1:20,  house2:60,  house3:180,  house4:320, hotel:450} }
    ]
  },
  {
    name: "sky", buildCost: 50,
    color: "#87CEEB",
    cells: [
      { id:9,  name:"桂林", price:100, rent:{base:6,  house1:30,  house2:90,  house3:270,  house4:400, hotel:550} },
      { id:10, name:"贵阳", price:100, rent:{base:6,  house1:30,  house2:90,  house3:270,  house4:400, hotel:550} },
      { id:11, name:"海口", price:120, rent:{base:8,  house1:40,  house2:100, house3:300,  house4:450, hotel:600} }
    ]
  },
  {
    name: "pink", buildCost: 100,
    color: "#FF69B4",
    cells: [
      { id:13, name:"苏州", price:140, rent:{base:10, house1:50,  house2:150, house3:450,  house4:625, hotel:750} },
      { id:14, name:"扬州", price:140, rent:{base:10, house1:50,  house2:150, house3:450,  house4:625, hotel:750} },
      { id:17, name:"泉州", price:160, rent:{base:12, house1:60,  house2:180, house3:500,  house4:700, hotel:900} }
    ]
  },
  {
    name: "orange", buildCost: 100,
    color: "#FF8C42",
    cells: [
      { id:18, name:"洛阳", price:180, rent:{base:14, house1:70,  house2:200, house3:550,  house4:750, hotel:950} },
      { id:20, name:"开封", price:180, rent:{base:14, house1:70,  house2:200, house3:550,  house4:750, hotel:950} },
      { id:21, name:"大同", price:200, rent:{base:16, house1:80,  house2:220, house3:600,  house4:800, hotel:1000} }
    ]
  },
  {
    name: "red", buildCost: 150,
    color: "#E74C3C",
    cells: [
      { id:24, name:"武汉", price:220, rent:{base:18, house1:90,  house2:250, house3:700,  house4:875, hotel:1050} },
      { id:26, name:"长沙", price:220, rent:{base:18, house1:90,  house2:250, house3:700,  house4:875, hotel:1050} },
      { id:27, name:"重庆", price:240, rent:{base:20, house1:100, house2:300, house3:750,  house4:925, hotel:1100} }
    ]
  },
  {
    name: "yellow", buildCost: 150,
    color: "#F1C40F",
    cells: [
      { id:28, name:"沈阳", price:260, rent:{base:22, house1:110, house2:330, house3:800,  house4:975, hotel:1150} },
      { id:29, name:"大连", price:260, rent:{base:22, house1:110, house2:330, house3:800,  house4:975, hotel:1150} },
      { id:31, name:"青岛", price:280, rent:{base:24, house1:120, house2:360, house3:850,  house4:1025,hotel:1200} }
    ]
  },
  {
    name: "green", buildCost: 200,
    color: "#2ECC71",
    cells: [
      { id:34, name:"南京", price:300, rent:{base:26, house1:130, house2:390, house3:900,  house4:1100,hotel:1275} },
      { id:36, name:"杭州", price:300, rent:{base:26, house1:130, house2:390, house3:900,  house4:1100,hotel:1275} },
      { id:38, name:"成都", price:320, rent:{base:28, house1:150, house2:450, house3:1000, house4:1200,hotel:1400} }
    ]
  },
  {
    name: "navy", buildCost: 200,
    color: "#2C3E80",
    cells: [
      { id:39, name:"广州", price:350, rent:{base:35, house1:175, house2:500, house3:1100, house4:1300,hotel:1500} },
      { id:41, name:"厦门", price:350, rent:{base:35, house1:175, house2:500, house3:1100, house4:1300,hotel:1500} },
      { id:43, name:"深圳", price:400, rent:{base:50, house1:200, house2:600, house3:1400, house4:1700,hotel:2000} }
    ]
  },
  {
    name: "purple", buildCost: 200,
    color: "#8E44AD",
    cells: [
      { id:46, name:"西安",   price:380, rent:{base:38, house1:190, house2:550, house3:1200, house4:1500,hotel:1800} },
      { id:48, name:"合肥",   price:400, rent:{base:40, house1:200, house2:600, house3:1300, house4:1600,hotel:1900} },
      { id:51, name:"哈尔滨", price:420, rent:{base:42, house1:210, house2:630, house3:1400, house4:1700,hotel:2000} }
    ]
  },
  {
    name: "gold", buildCost: 250,
    color: "#DAA520",
    cells: [
      { id:54, name:"北京", price:460, rent:{base:46, house1:230, house2:700, house3:1500, house4:1800,hotel:2100} },
      { id:55, name:"上海", price:480, rent:{base:48, house1:240, house2:720, house3:1550, house4:1850,hotel:2200} },
      { id:56, name:"香港", price:520, rent:{base:52, house1:260, house2:780, house3:1700, house4:2000,hotel:2400} }
    ]
  }
]

全局资源池：房屋 48 栋，酒店 16 家。

建房规则：
  - 在自己回合，踩到自己拥有的地产时可升级一级
  - 不需要拥有同色组其他地产
  - 不需要均匀建造
  - 每次踩到最多升级一次
  - 支付该组 buildCost
  - 从全局 pool 扣除

卖房：回收建造成本的 50%（向下取整到 ¥10）

抵押：无房屋地产可抵押，获面值 50%
赎回：付抵押金额 + 10% 利息（取整到 ¥10）
抵押期间不收租、不可建房

================================================================
第八部分：车站系统
================================================================

四个车站：#7 南站、#22 西站、#37 北站、#52 东站

传送规则：
  #7  → #37（不经过起点）
  #37 → #7 （经过起点，收¥200）
  #22 → #52（不经过起点）
  #52 → #22（经过起点，收¥200）

租金（按拥有车站数）：1站¥50 / 2站¥100 / 3站¥200 / 4站¥400

流程：到达车站 → 可购买（如无主）→ 强制传送 → 对向站事件

================================================================
第九部分：公用事业
================================================================

#12 电力公司 ¥150
#32 自来水公司 ¥150
#53 天然气公司 ¥200

租金（踩到者掷 2 颗骰子）：
  拥有 1 个：点数 × 4
  拥有 2 个：点数 × 10
  拥有 3 个：点数 × 16

================================================================
第十部分：卡牌数据
================================================================

【命运卡 fateCards（20 张，用完重洗）】

{ id:1,  desc:"前进到起点，获¥200",                  effect:"go_start",           copies:2 }
{ id:2,  desc:"前进到香港#56（经起点收¥200）",        effect:"go_56",              copies:1 }
{ id:3,  desc:"前进到桂林#9（经起点收¥200）",         effect:"go_9",               copies:1 }
{ id:4,  desc:"前进到最近车站，付双倍租金",           effect:"nearest_station_2x", copies:1 }
{ id:5,  desc:"前进到最近公用事业，掷骰×10支付",      effect:"nearest_utility_x10",copies:1 }
{ id:6,  desc:"银行付你¥50股息",                      effect:"+50",                copies:2 }
{ id:7,  desc:"获得出狱通行证",                       effect:"jail_card",          copies:1 }
{ id:8,  desc:"后退3格",                              effect:"back_3",             copies:1 }
{ id:9,  desc:"直接入狱",                             effect:"go_jail",            copies:1 }
{ id:10, desc:"每栋房屋修缮¥25，每家酒店¥100",        effect:"repair",             copies:2 }
{ id:11, desc:"获建筑贷款¥150",                       effect:"+150",               copies:1 }
{ id:12, desc:"你是董事长，付每人¥50",                effect:"pay_all_50",         copies:2 }
{ id:13, desc:"猜谜大赛获¥100",                       effect:"+100",               copies:1 }
{ id:14, desc:"寿险到期获¥100",                       effect:"+100",               copies:1 }
{ id:15, desc:"学校税付¥150",                         effect:"-150",               copies:1 }
{ id:16, desc:"前进到上海#55（经起点收¥200）",        effect:"go_55",              copies:1 }
{ id:17, desc:"拥有3栋以上房屋的地产，每块获¥50",     effect:"houses_bonus",       copies:1 }

【公共基金卡 fundCards（20 张，用完重洗）】

{ id:1,  desc:"银行发错获¥200",           effect:"+200",           copies:1 }
{ id:2,  desc:"医疗费付¥50",              effect:"-50",            copies:2 }
{ id:3,  desc:"出售股票获¥50",            effect:"+50",            copies:2 }
{ id:4,  desc:"人寿保险获¥100",           effect:"+100",           copies:1 }
{ id:5,  desc:"学费付¥50",                effect:"-50",            copies:1 }
{ id:6,  desc:"歌唱比赛获¥25",            effect:"+25",            copies:1 }
{ id:7,  desc:"退税获¥20",                effect:"+20",            copies:2 }
{ id:8,  desc:"生日快乐，每人付你¥10",    effect:"birthday",       copies:1 }
{ id:9,  desc:"咨询费获¥25",              effect:"+25",            copies:1 }
{ id:10, desc:"街道修缮，每房¥40每酒店¥115", effect:"street_repair", copies:2 }
{ id:11, desc:"获得出狱通行证",           effect:"jail_card",      copies:1 }
{ id:12, desc:"前进到起点",               effect:"go_start",       copies:1 }
{ id:13, desc:"继承¥100",                effect:"+100",           copies:1 }
{ id:14, desc:"资产维修费付¥45",          effect:"-45",            copies:1 }
{ id:15, desc:"直接入狱",                 effect:"go_jail",        copies:1 }
{ id:16, desc:"社区捐款付¥50",            effect:"-50",            copies:1 }
{ id:17, desc:"小彩票获¥200",             effect:"+200",           copies:1 }
{ id:18, desc:"免费租金险（下次租金免付）", effect:"free_rent",      copies:1 }

================================================================
第十一部分：趣味格详细规则
================================================================

【#8 幸运转盘 lucky_wheel】
  舞台展示 8 格转盘旋转动画（CSS 或 Three.js 动画）
  随机结果 1~8：
    1: 大吉 +¥300
    2: 中吉 +¥150
    3: 小吉 +¥50
    4: 平安无事
    5: 前进 3 格 → 触发目标格效果
    6: 后退 3 格 → 触发目标格效果（后退过起点不收¥200）
    7: 小凶 -¥100
    8: 大凶 -¥250

【#16 擂台挑战 arena】
  舞台展示选择对手界面
  选择一名未破产且未在狱中的对手
  双方各掷 1 颗骰子，舞台展示双方骰子动画
  点数大者赢，输家付赢家 ¥150
  平局无人支付

【#25 许愿喷泉 wish_fountain】
  舞台展示三个许愿选项（卡片式选择）：
    A. 财富之愿 ¥100：下次经过起点获 ¥500（替代¥200）
    B. 安宁之愿 ¥150：下次应付租金减半（取整到¥10）
    C. 幸运之愿 ¥80：下次掷骰可选 1 颗或 2 颗骰子
  可放弃
  同时只能持 1 个，再次许愿覆盖

【#33 黑市商人 black_market】
  舞台展示两个选项：
    A. 黑市购房：以面值 80% 购买银行未售地产（取整到¥10）
      → 展示可购买列表供选择
    B. 黑市套现：将自己无房屋无抵押地产以面值 120% 卖给银行（取整到¥10）
      → 展示可出售列表供选择
  可放弃

【#42 社区彩票 lottery】
  所有玩家强制参与
  舞台展示动画：
    1. 每人投入 ¥50 进奖池（现金不足者免投不参与分配）
    2. 踩到者掷 2 颗骰子
    3. 双骰：踩到者独得全部奖池
       点数7：踩到者得¥200，余下平分给其他玩家
       其他：踩到者得¥100，余下随机分给 2 名其他玩家各一半

【#50 拆迁办 demolition】
  舞台展示所有可拆迁目标列表（所有玩家有房屋的地产）
  可选择拆除 1 栋房屋（可拆任何人的），获得 ¥50 补偿
  不可拆酒店，不可拆抵押地产，可放弃

【#58 锦鲤池 koi_pond】
  舞台展示掷骰动画
  掷 2 颗骰子对照：
    双6: ¥1000 / 其他双骰: ¥500 / 7点: ¥300
    6或8: ¥100 / 其他: ¥0

================================================================
第十二部分：税务
================================================================

#5  所得税：缴 ¥200
#44 奢侈税：缴 ¥100
#59 资产税：¥150 + 每持有1块地产¥10（含车站和公用事业），上限¥300

================================================================
第十三部分：骰子与入狱
================================================================

2 颗 6 面骰，点数范围 2~12。
  双骰：可再掷一次
  连续第三次双骰：直接入狱

入狱方式：踩到 #45 / 连续3次双骰 / 抽到入狱卡
#15 探访格，路过无事

入狱期间：不收租，不可移动，可交易，可建房

出狱方式（三选一）：
  1. 支付 ¥75 保释金
  2. 掷出双骰即刻出狱并移动
  3. 使用出狱通行证

最多停留 3 回合，第 3 回合强制付 ¥75

================================================================
第十四部分：中央舞台系统
================================================================

舞台是覆盖在棋盘中央的 UI 浮层（2D div，叠加在 Canvas 上方）。
默认隐藏，回合触发时弹出，所有玩家同步看到相同内容。

回合三幕结构：

【第一幕 —— 掷骰子（舞台展示）】
  弹出舞台，展示：
    - 当前玩家头像 + 昵称
    - 两颗骰子 3D 翻转动画（持续 1.5 秒）
    - 最终显示点数（大号 Fredoka 数字）
    - 双骰时显示"✨ 再掷一次！"
    - 连续三次双骰显示"🚨 入狱！"
    - 在狱中时展示三个出狱选项按钮
  展示 2~3 秒后自动关闭

【第二幕 —— 棋子移动（无舞台，棋盘可见）】
  舞台关闭
  棋盘上棋子逐格跳跃前进（每格 300ms，用 lerp 动画）
  所有玩家同步观看
  经过起点：闪光特效 + 浮动 "+¥200" 文字
  到达车站：触发传送动画（棋子飞向对向站）

【第三幕 —— 格子事件（舞台展示）】
  舞台重新弹出，展示落地格信息：
    上部：大号 emoji + 格子名称 + 格子类型
    中部：事件结果（金额/卡牌/转盘结果等）
    底部三行：
      "📋 这是什么格子" → 格子类型说明
      "🎮 玩家主动做了什么" → 购买/许愿等
      "⚡ 被动发生了什么" → 缴租/缴税/抽卡等

  需要操作的事件在舞台内等待玩家操作：
    购买地产 → 买 / 不买
    擂台挑战 → 选择对手
    许愿喷泉 → A / B / C / 放弃
    黑市商人 → A / B / 放弃
    拆迁办 → 选择目标 / 放弃
    出狱选择 → 付保释 / 掷骰 / 出狱卡
  操作完毕后舞台关闭

【自由操作阶段】
  第三幕关闭后：
    当前回合玩家可执行：
      - 建房（踩到自己地产时可建，下拉选择）
      - 交易（发起交易请求，打开交易弹窗）
      - 抵押 / 赎回（打开地产管理弹窗）
      - 结束回合
    操作按钮变为可用状态
    非当前回合玩家所有按钮禁用

  双骰：自由操作结束后自动回到第一幕再掷
  三回合入狱：结束回合

【舞台 UI 规范】
  背景：半透明深色遮罩 + backdrop-blur
  卡片：白色/浅色，border-radius: 24px
  入场：scale(0.92) + translateY(20px) → 原位
  用 Framer Motion 的 spring 动画
  内部：上方视觉区 + 中部信息区 + 底部按钮区

================================================================
第十五部分：交易系统
================================================================

仅当前回合玩家可发起。
交易内容：现金 + 地产 + 出狱通行证。
有房屋的地产不可交易（必须先卖房）。
抵押地产可交易（接收方继承抵押状态）。

交易 UI：
  左栏"我方给出"：现金输入 + 地产复选 + 通行证复选
  右栏"对方给出"：同上
  对方选择：接受 / 拒绝

================================================================
第十六部分：破产规则
================================================================

当玩家需支付但现金不足：
  1. 服务端通知客户端进入自救模式
  2. 玩家尝试卖房、抵押、交易
  3. 仍不足则破产：
     - 欠其他玩家：全部资产转让给债主
     - 欠银行：资产归还银行（变为无主）
  4. 标记 bankrupt，跳过其回合

================================================================
第十七部分：Socket.IO 事件协议
================================================================

namespace: /lobby
namespace: /game

【大厅事件】
  Client→Server:
    "create_room"   { nickname: string, emoji: string }
    "join_room"     { roomId: string, nickname: string, emoji: string }
    "player_ready"  { roomId: string }
    "start_game"    { roomId: string }

  Server→Client:
    "room_created"  { roomId: string }
    "room_joined"   { roomId: string, players: PlayerInfo[] }
    "room_update"   { players: PlayerInfo[], hostId: string }
    "game_starting" { countdown: number }

【游戏事件 —— 服务端→客户端】
  "state_sync"        { state: GameFullState }        ← 完整同步（加入/重连）
  "turn_begin"        { playerId, turnNumber }
  "stage_start"       { stage: 1|2|3, content: any }
  "stage_end"         { stage: 1|2|3 }
  "dice_result"       { dice: [number,number], isDouble, consecutiveDoubles }
  "move_start"        { playerId, from, to, path: number[] }
  "move_step"         { playerId, cellId }            ← 每到一格
  "move_end"          { playerId, cellId }
  "teleport"          { playerId, from, to, passedStart }
  "cash_change"       { playerId, amount, reason }
  "property_change"   { cellId, owner?, buildings?, mortgaged? }
  "card_drawn"        { deckType: "fate"|"fund", card, playerId }
  "need_input"        { inputType: string, options: any, timeout?: number }
  "player_acted"      { playerId, action, detail }    ← 广播给所有人
  "bankrupt"          { playerId, creditorId? }
  "game_over"         { winnerId, scores? }
  "error"             { message: string }

【游戏事件 —— 客户端→服务端】
  "action"  { type: ActionType, payload?: any }

  ActionType 枚举：
    "roll_dice"
    "buy_property"       { cellId }
    "skip_buy"
    "build_house"        { cellId }
    "sell_house"         { cellId }
    "mortgage"           { cellId }
    "redeem"             { cellId }
    "trade_offer"        { toId, giveCash, giveProperties, giveJailCards,
                           wantCash, wantProperties, wantJailCards }
    "trade_respond"      { tradeId, accept: boolean }
    "end_turn"
    "jail_pay"
    "jail_roll"
    "jail_card"
    "select_opponent"    { targetId }         ← 擂台
    "wish_choose"        { option: "A"|"B"|"C"|"skip" }
    "blackmarket_choose" { option: "A"|"B"|"skip", targetCellId? }
    "demolish_choose"    { cellId | null }    ← null = 放弃
    "lottery_result"     (自动，无需额外参数)

================================================================
第十八部分：服务端游戏状态
================================================================

GameFullState 结构：

{
  roomId: string
  players: PlayerState[]       // 2~6 人
  board: {
    [cellId: number]: {
      owner: string | null
      buildings: 0|1|2|3|4|5
      mortgaged: boolean
    }
  }
  currentTurnIndex: number     // players 数组下标
  turnNumber: number
  phase: TurnPhase
  consecutiveDoubles: number
  housePool: number            // 初始 48
  hotelPool: number            // 初始 16
  fateDeck: number[]           // 洗好的命运卡 id 序列
  fundDeck: number[]           // 洗好的公共基金卡 id 序列
  fateIndex: number
  fundIndex: number
  lotteryPot: number
  pendingTrade: TradeOffer | null
}

PlayerState 结构：

{
  id: string
  nickname: string
  emoji: string
  cash: number                 // 初始 1800
  position: number             // 0~59
  inJail: boolean
  jailTurns: number
  bankrupt: boolean
  properties: number[]         // cellId 列表
  stations: number[]
  utilities: number[]
  getOutOfJailCards: number
  wish: { type: string } | null
  freeRentCard: boolean
  connected: boolean
}

回合流程状态机（TurnManager 管理）：
  1. phase = "jail_choice"（如在狱中）→ 等待出狱操作
  2. phase = "rolling" → 发送 stage 1，等待掷骰
  3. phase = "moving" → 计算路径，发送 move 动画
  4. phase = "event" → 处理落地格，发送 stage 3
     如需操作 → phase = "input_required"，等待客户端操作
  5. phase = "free_action" → 等待建房/交易/结束
  6. 检查双骰 → 回到 2 或 nextTurn()

================================================================
第十九部分：前端 Store 设计
================================================================

【gameStore（Zustand）】
  state:
    myPlayerId: string
    players: PlayerState[]
    board: { [cellId: number]: PropertyState }
    currentTurnIndex: number
    turnNumber: number
    phase: TurnPhase
    consecutiveDoubles: number
    housePool: number
    hotelPool: number
    lotteryPot: number
    pendingTrade: TradeOffer | null

  actions:
    syncState(state)           ← state_sync 时调用
    updatePlayer(id, partial)
    updateCell(cellId, partial)
    setPhase(phase)
    ...

【uiStore（Zustand）】
  state:
    stageVisible: boolean
    stageType: null | "dice" | "event" | "wheel" | "arena" | ...
    stageContent: any
    inputRequired: null | { type, options }
    selectedCell: number | null     ← 弹窗展示的地产
    tradePanelOpen: boolean
    tradeTarget: string | null
    managePanelOpen: boolean
    animationQueue: AnimationEvent[]  ← 棋子移动等动画队列

  actions:
    showStage(type, content)
    hideStage()
    requireInput(type, options)
    clearInput()
    openPropertyDetail(cellId)
    closePropertyDetail()
    ...

【socketStore（Zustand）】
  state:
    socket: Socket | null
    connected: boolean
    roomId: string | null

  actions:
    connect()
    disconnect()
    emit(type, payload)

================================================================
第二十部分：3D 场景组件实现指引
================================================================

【GameCanvas.tsx —— R3F 入口】
  <Canvas shadows camera={{ position:[0,14,12], fov:40 }}>
    <color attach="background" args={["#f0e6d8"]} />
    <ambientLight intensity={0.5} />
    <directionalLight
      castShadow
      position={[8,15,8]}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={50}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={15}
      shadow-camera-bottom={-15}
    />
    <Environment preset="apartment" />
    <ContactShadows position={[0,-0.01,0]} opacity={0.4} blur={2} />
    <Table />
    <BoardMesh>
      {cells.map(c => <Cell key={c.id} ... />)}
      {buildings.map(b => <Building key={b.cellId} ... />)}
      {players.map(p => <PlayerToken key={p.id} ... />)}
      <CenterArea />
    </BoardMesh>
    <CameraController />
    <Effects />
  </Canvas>

【Table.tsx —— 木桌】
  <mesh receiveShadow position={[0, -0.15, 0]}>
    <boxGeometry args={[14, 0.3, 14]} />
    <meshStandardMaterial
      map={woodTexture}
      roughness={0.7}
      metalness={0.05}
      color="#6b4226"
    />
  </mesh>

【BoardMesh.tsx —— 棋盘底板】
  <group position={[0, 0, 0]}>
    <mesh receiveShadow>
      <boxGeometry args={[12, 0.15, 12]} />
      <meshStandardMaterial
        map={feltTexture}
        roughness={0.95}
        metalness={0}
        color="#f5ede0"
      />
    </mesh>
    {/* 侧面（厚度） */}
    <mesh position={[0, -0.075, 0]}>
      <boxGeometry args={[12, 0.15, 12]} />
      <meshStandardMaterial color="#8b7355" />
    </mesh>
    {children}
  </group>

【Cell.tsx —— 格子】
  <group position={cellWorldPos}>
    {/* 格子面 */}
    <mesh receiveShadow>
      <boxGeometry args={[cellW, 0.05, cellH]} />
      <meshStandardMaterial color={cellColor} />
    </mesh>
    {/* 顶部色条（如有地产组色） */}
    {groupColor && (
      <mesh position={[0, 0.03, -cellH/2 + 0.05]}>
        <boxGeometry args={[cellW * 0.8, 0.02, 0.08]} />
        <meshStandardMaterial color={groupColor} />
      </mesh>
    )}
    {/* 格子文字（drei Text） */}
    <Text
      position={[0, 0.04, 0]}
      fontSize={0.15}
      color="#2d2b55"
      anchorX="center"
      anchorY="middle"
    >
      {cell.name}
    </Text>
    {/* emoji（drei Text） */}
    <Text
      position={[0, 0.04, -0.15]}
      fontSize={0.25}
      anchorX="center"
    >
      {cell.emoji}
    </Text>
  </group>

【Building.tsx —— 房屋/酒店】
  if buildings >= 1 && buildings <= 4:
    {/* 1~4 栋小房屋，按数量排列 */}
    {Array.from({length: buildings}).map((_, i) => (
      <group key={i} position={getHousePosition(i, buildings)}>
        {/* 屋顶 */}
        <mesh>
          <coneGeometry args={[0.15, 0.2, 4]} />
          <meshStandardMaterial color={roofColor} />
        </mesh>
        {/* 墙壁 */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.2, 0.15, 0.2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      </group>
    ))}

  if buildings === 5:
    {/* 酒店 */}
    <group>
      <mesh>
        <boxGeometry args={[0.25, 0.4, 0.2]} />
        <meshStandardMaterial color={hotelColor} />
      </mesh>
      {/* 窗户：小方块 emissive */}
    </group>

【PlayerToken.tsx —— 棋子】
  方案（选其一，推荐 B）：
  A. 球体 + 颜色：
    <mesh>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color={playerColor} />
    </mesh>

  B. emoji 文字：
    <Text fontSize={0.4} anchorX="center">
      {player.emoji}
    </Text>
    {/* 底部光环 */}
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]}>
      <ringGeometry args={[0.15, 0.22, 16]} />
      <meshBasicMaterial color={glowColor} transparent opacity={0.5} />
    </mesh>

  移动动画：useFrame 中 lerp position

【CameraController.tsx】
  <OrbitControls
    enablePan={false}
    maxPolarAngle={Math.PI / 2.5}
    minDistance={8}
    maxDistance={20}
    enableDamping
    dampingFactor={0.05}
  />
  回合切换时用 gsap 或自定义 useFrame 动画平滑移动摄像机

================================================================
第二十一部分：特效设计
================================================================

【过起点特效】
  3D：粒子系统（金色圆片从起点向上散射）
  2D：浮动文字 "+¥200" 从底部飘上并淡出

【车站传送】
  3D：棋子缩放到 0 → 在目标位置缩放出现
  2D：传送连线动画（发光线条连接两个车站）

【转盘旋转】
  2D：SVG 转盘 + CSS transform rotate 动画
  或 3D：圆形平面 + 贴图 + 旋转动画

【金币变动】
  2D：数字飞入飞出（Framer Motion animate）

【破产】
  3D：棋子碎裂或下沉动画
  2D：玩家卡片灰化 + 打叉

================================================================
第二十二部分：计分模式（可选）
================================================================

游戏满 60 回合后可选择进入计分模式：
  得分 = 现金÷10 + 地产面值÷10 + 每栋房×5 + 每家酒店×20
       + 抵押地产面值÷20 + 出狱卡每张×3 + 许愿效果×2

================================================================
第二十三部分：开发优先级
================================================================

Phase 1（核心可玩）：
  - 大厅：创建/加入房间，等待室
  - 3D 棋盘渲染（木桌 + 棋盘 + 60 格文字）
  - 棋子显示和移动动画
  - 掷骰子（第一幕舞台）
  - 移动（第二幕动画）
  - 地产购买/缴租（第三幕基础）
  - 回合制轮转
  - 基本侧边栏玩家卡片

Phase 2（完整棋盘）：
  - 建筑 3D 模型（房屋/酒店）
  - 建房/卖房/抵押
  - 车站传送系统
  - 公用事业掷骰缴租
  - 命运卡 + 公共基金卡
  - 入狱/出狱

Phase 3（趣味系统）：
  - 7 个趣味格全部实现（转盘动画/擂台/许愿/黑市/彩票/拆迁/锦鲤）
  - 交易系统
  - 破产处理
  - 税务处理

Phase 4（打磨）：
  - 所有特效（过起点/传送/金币/破产）
  - 断线重连
  - 计分模式
  - 响应式移动端
  - 音效（可选）

================================================================
第二十四部分：技术约束总结
================================================================

- 前端：React 18 + TypeScript + Vite
- 3D：React Three Fiber + drei + postprocessing
- 后端：Node.js + TypeScript + Socket.IO + Express
- 状态：Zustand
- 验证：Zod
- 样式：Tailwind CSS
- 动画：Framer Motion（2D UI）+ R3F useFrame（3D 动画）
- 所有类型定义在 shared/types.ts，前后端共享
- 服务端为权威状态源，客户端只做展示和操作提交
- 所有客户端发送的 action 必须经过 Zod 验证
- 3D 建筑用纯几何体绘制（ConeGeometry + BoxGeometry），不用外部模型
- 棋子推荐用 drei Text 渲染 emoji 或加载简单 GLTF
- 摄像机可自由旋转（OrbitControls），回合切换自动飞向当前玩家
- 代码输出为完整可运行项目，包含所有文件

================================================================