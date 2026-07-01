# Phase 2 · 完整棋盘

> 依赖 [Phase 1](phase1-core.md) 的共享基础（类型 / 地图 / 地产数据 / Socket 协议 / 状态机）。
> 本阶段把核心玩法补全：建筑、抵押、车站、公用事业、卡牌、入狱。

---

## Phase 2 交付清单

- 建筑 3D 模型（房屋/酒店）
- 建房 / 卖房 / 抵押 / 赎回
- 车站传送系统
- 公用事业掷骰缴租
- 命运卡 + 公共基金卡
- 入狱 / 出狱

---

## 一、地产建筑系统

全局资源池：房屋 **48** 栋，酒店 **16** 家（`housePool` / `hotelPool`）。
`BuildingLevel`：0=空地，1~4=房屋，5=酒店。

**建房规则**
- 在自己回合，踩到自己拥有的地产时可升级一级
- 不需要拥有同色组其他地产
- 不需要均匀建造
- 每次踩到最多升级一次
- 支付该组 `buildCost`（见 propertyData）
- 从全局 pool 扣除（升到 5/酒店时：归还 4 栋房屋到 housePool，从 hotelPool 扣 1）

**卖房**：回收建造成本的 50%，向下取整到 ¥10。房屋退回 housePool，酒店退回 hotelPool。

**抵押**：无房屋地产可抵押，获面值 50%。
**赎回**：付抵押金额 + 10% 利息（取整到 ¥10）。
抵押期间不收租、不可建房。

租金计算（落到他人有主地产）：
- buildings=0 → `rent.base`
- 1~4 → `rent.house1..house4`
- 5 → `rent.hotel`
- 抵押中 → 不收租

涉及文件：`actions/BuildHouse.ts`、`actions/SellHouse.ts`、`actions/Mortgage.ts`、`game/Property.ts`、前端 `Modals/PropertyManage.tsx`、`Board3D/Building.tsx`。

---

## 二、建筑 3D 组件（Building.tsx）

纯几何体绘制，不用外部模型。`color` prop 来自地产组色，y 随等级递增，每栋下方投 ContactShadows。

```tsx
// 1~4 栋小房屋，按数量排列
{buildings >= 1 && buildings <= 4 &&
  Array.from({length: buildings}).map((_, i) => (
    <group key={i} position={getHousePosition(i, buildings)}>
      <mesh> {/* 屋顶 */}
        <coneGeometry args={[0.15, 0.2, 4]} />
        <meshStandardMaterial color={roofColor} />
      </mesh>
      <mesh position={[0, -0.1, 0]}> {/* 墙壁 */}
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
    </group>
  ))}

// 5 = 酒店：较高 box + 小窗户(emissive)
{buildings === 5 &&
  <group>
    <mesh>
      <boxGeometry args={[0.25, 0.4, 0.2]} />
      <meshStandardMaterial color={hotelColor} />
    </mesh>
    {/* 窗户：小方块 emissive */}
  </group>}
```

入场动画：建筑 stagger 100ms 缩放弹入（scale 0→1）。

---

## 三、车站系统（actions/Station.ts）

四个车站：#7 南站、#22 西站、#37 北站、#52 东站。

**传送规则**
- #7 → #37（不经过起点）
- #37 → #7（经过起点，收 ¥200）
- #22 → #52（不经过起点）
- #52 → #22（经过起点，收 ¥200）

**租金**（按拥有车站数）：1 站 ¥50 / 2 站 ¥100 / 3 站 ¥200 / 4 站 ¥400。

**流程**：到达车站 → 可购买（如无主）→ 强制传送 → 触发对向站事件。

特效（Phase 4 打磨，本阶段先把逻辑跑通）：棋子缩放到 0 → 在目标位置缩放出现；2D 发光连线。Socket：`teleport { playerId, from, to, passedStart }`。

---

## 四、公用事业（actions/Utility.ts）

- #12 电力公司 ¥150
- #32 自来水公司 ¥150
- #53 天然气公司 ¥200

**租金**（踩到者掷 2 颗骰子）：
- 拥有 1 个：点数 × 4
- 拥有 2 个：点数 × 10
- 拥有 3 个：点数 × 16

---

## 五、税务（actions/Tax.ts）

- #5 所得税：缴 ¥200
- #44 奢侈税：缴 ¥100
- #59 资产税：¥150 + 每持有 1 块地产 ¥10（含车站和公用事业），上限 ¥300

> 税务逻辑较简单，可在本阶段一并实现（落地即扣款）。

---

## 六、卡牌系统（CardDeck.ts + DrawCard.ts）

命运卡 / 公共基金卡各按 `copies` 展开后洗牌（Fisher–Yates），用 `fateDeck`/`fundDeck` 存 id 序列 + `fateIndex`/`fundIndex` 指针，用完重洗。
服务端解析 `effect` 字段执行；Socket 广播 `card_drawn { deckType, card, playerId }`。

### 命运卡 fateCards（fateCards.ts）

```
{ id:1,  desc:"前进到起点，获¥200",               effect:"go_start",            copies:2 }
{ id:2,  desc:"前进到香港#56（经起点收¥200）",     effect:"go_56",               copies:1 }
{ id:3,  desc:"前进到桂林#9（经起点收¥200）",      effect:"go_9",                copies:1 }
{ id:4,  desc:"前进到最近车站，付双倍租金",         effect:"nearest_station_2x",  copies:1 }
{ id:5,  desc:"前进到最近公用事业，掷骰×10支付",    effect:"nearest_utility_x10", copies:1 }
{ id:6,  desc:"银行付你¥50股息",                   effect:"+50",                 copies:2 }
{ id:7,  desc:"获得出狱通行证",                     effect:"jail_card",           copies:1 }
{ id:8,  desc:"后退3格",                           effect:"back_3",              copies:1 }
{ id:9,  desc:"直接入狱",                           effect:"go_jail",             copies:1 }
{ id:10, desc:"每栋房屋修缮¥25，每家酒店¥100",      effect:"repair",              copies:2 }
{ id:11, desc:"获建筑贷款¥150",                     effect:"+150",                copies:1 }
{ id:12, desc:"你是董事长，付每人¥50",              effect:"pay_all_50",          copies:2 }
{ id:13, desc:"猜谜大赛获¥100",                     effect:"+100",                copies:1 }
{ id:14, desc:"寿险到期获¥100",                     effect:"+100",                copies:1 }
{ id:15, desc:"学校税付¥150",                       effect:"-150",                copies:1 }
{ id:16, desc:"前进到上海#55（经起点收¥200）",      effect:"go_55",               copies:1 }
{ id:17, desc:"拥有3栋以上房屋的地产，每块获¥50",   effect:"houses_bonus",        copies:1 }
```

### 公共基金卡 fundCards（fundCards.ts）

```
{ id:1,  desc:"银行发错获¥200",            effect:"+200",          copies:1 }
{ id:2,  desc:"医疗费付¥50",               effect:"-50",           copies:2 }
{ id:3,  desc:"出售股票获¥50",             effect:"+50",           copies:2 }
{ id:4,  desc:"人寿保险获¥100",            effect:"+100",          copies:1 }
{ id:5,  desc:"学费付¥50",                 effect:"-50",           copies:1 }
{ id:6,  desc:"歌唱比赛获¥25",             effect:"+25",           copies:1 }
{ id:7,  desc:"退税获¥20",                 effect:"+20",           copies:2 }
{ id:8,  desc:"生日快乐，每人付你¥10",      effect:"birthday",      copies:1 }
{ id:9,  desc:"咨询费获¥25",               effect:"+25",           copies:1 }
{ id:10, desc:"街道修缮，每房¥40每酒店¥115", effect:"street_repair", copies:2 }
{ id:11, desc:"获得出狱通行证",            effect:"jail_card",     copies:1 }
{ id:12, desc:"前进到起点",                effect:"go_start",      copies:1 }
{ id:13, desc:"继承¥100",                  effect:"+100",          copies:1 }
{ id:14, desc:"资产维修费付¥45",            effect:"-45",           copies:1 }
{ id:15, desc:"直接入狱",                  effect:"go_jail",       copies:1 }
{ id:16, desc:"社区捐款付¥50",             effect:"-50",           copies:1 }
{ id:17, desc:"小彩票获¥200",              effect:"+200",          copies:1 }
{ id:18, desc:"免费租金险（下次租金免付）",  effect:"free_rent",     copies:1 }
```

> effect 约定：`+N`/`-N` 直接增减现金；`go_X` 移动到格子（经起点收 ¥200）；`go_jail` 入狱；`back_3` 后退 3 格并触发目标格；`jail_card` 出狱卡 +1；`pay_all_50`/`birthday` 多人结算；`repair`/`street_repair` 按建筑数扣款；`free_rent` 设 `freeRentCard=true`；`nearest_*` 找最近车站/公用事业。

---

## 七、入狱与出狱（actions/Jail.ts + Dice.ts）

**入狱方式**：踩到 #45 / 连续 3 次双骰 / 抽到入狱卡。
**#15 探访格**：路过无事。

**入狱期间**：不收租、不可移动；可交易、可建房。

**出狱方式（三选一）**：
1. 支付 ¥75 保释金
2. 掷出双骰即刻出狱并移动
3. 使用出狱通行证（`getOutOfJailCards`）

最多停留 3 回合，第 3 回合强制付 ¥75。

回合流程接入：`phase="jail_choice"` 在狱中时先等出狱操作。
Socket / action：`jail_pay`、`jail_roll`、`jail_card`。

---

## 八、骰子完整逻辑（Dice.ts + RollDice.ts）

2 颗 6 面骰，点数 2~12。
- 双骰：可再掷一次（自由操作结束后回第一幕再掷）
- 连续第三次双骰：直接入狱
- `consecutiveDoubles` 计数，入狱后清零

舞台第一幕：双骰显示"✨ 再掷一次！"，三连双骰显示"🚨 入狱！"。

---

## 九、本阶段验证要点

- 建房后租金正确按等级跳变；卖房/抵押后金额取整规则正确（¥10）
- housePool/hotelPool 不会被透支；酒店占用与房屋归还正确
- 四车站传送方向与过起点收款正确
- 公用事业按拥有数倍率计租
- 卡组洗牌、用完重洗、指针正确；各 effect 结算正确
- 入狱三种出路、三回合强制保释正确
