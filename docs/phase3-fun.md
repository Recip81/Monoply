# Phase 3 · 趣味系统

> 依赖 [Phase 1](phase1-core.md) / [Phase 2](phase2-board.md)。
> 本阶段实现 7 个趣味格、交易系统、破产处理（税务已在 Phase 2 落地）。

---

## Phase 3 交付清单

- 7 个趣味格全部实现（转盘 / 擂台 / 许愿 / 黑市 / 彩票 / 拆迁 / 锦鲤）
- 交易系统
- 破产处理

每个趣味格 = 服务端逻辑（`game/actions/fun/*.ts`）+ 前端舞台（`components/Stage/*Stage.tsx`）。
所有需要操作的事件在舞台内等待玩家操作，所有玩家同步看到相同内容。

---

## 一、#8 幸运转盘 lucky_wheel

`LuckyWheel.ts` + `WheelStage.tsx`。舞台展示 8 格转盘旋转动画（CSS/SVG transform rotate 或 Three.js）。
随机结果 1~8：

| 结果 | 效果 |
|---|---|
| 1 大吉 | +¥300 |
| 2 中吉 | +¥150 |
| 3 小吉 | +¥50 |
| 4 平安 | 无事 |
| 5 | 前进 3 格 → 触发目标格效果 |
| 6 | 后退 3 格 → 触发目标格效果（后退过起点不收 ¥200）|
| 7 小凶 | -¥100 |
| 8 大凶 | -¥250 |

---

## 二、#16 擂台挑战 arena

`Arena.ts` + `ArenaStage.tsx`。
- 舞台展示选择对手界面，选一名**未破产且未在狱中**的对手
- 双方各掷 1 颗骰子（舞台展示双方骰子动画）
- 点数大者赢，输家付赢家 ¥150；平局无人支付

action：`select_opponent { targetId }`。

---

## 三、#25 许愿喷泉 wish_fountain

`WishFountain.ts` + `WishStage.tsx`。三个许愿选项（卡片式选择），可放弃。
同时只能持 1 个，再次许愿覆盖（`PlayerState.wish`）。

| 选项 | 花费 | 效果 |
|---|---|---|
| A 财富之愿 | ¥100 | 下次经过起点获 ¥500（替代 ¥200）|
| B 安宁之愿 | ¥150 | 下次应付租金减半（取整到 ¥10）|
| C 幸运之愿 | ¥80 | 下次掷骰可选 1 颗或 2 颗骰子 |

action：`wish_choose { option: "A"|"B"|"C"|"skip" }`。

---

## 四、#33 黑市商人 black_market

`BlackMarket.ts` + `BlackMarketStage.tsx`。两个选项，可放弃。

- **A 黑市购房**：以面值 80% 购买银行未售地产（取整到 ¥10）→ 展示可购买列表供选择
- **B 黑市套现**：将自己无房屋无抵押地产以面值 120% 卖给银行（取整到 ¥10）→ 展示可出售列表供选择

action：`blackmarket_choose { option: "A"|"B"|"skip", targetCellId? }`。

---

## 五、#42 社区彩票 lottery

`Lottery.ts` + `LotteryStage.tsx`。所有玩家强制参与。`lotteryPot` 为全局奖池。

1. 每人投入 ¥50 进奖池（现金不足者免投、不参与分配）
2. 踩到者掷 2 颗骰子
3. 结算：
   - 双骰：踩到者独得全部奖池
   - 点数 7：踩到者得 ¥200，余下平分给其他玩家
   - 其他：踩到者得 ¥100，余下随机分给 2 名其他玩家各一半

action：`lottery_result`（自动，无需额外参数）。

---

## 六、#50 拆迁办 demolition

`Demolition.ts` + `DemolitionStage.tsx`。
舞台展示所有可拆迁目标列表（所有玩家有房屋的地产）。
- 可选择拆除 1 栋房屋（可拆任何人的），获 ¥50 补偿
- 不可拆酒店、不可拆抵押地产、可放弃
- 拆除的房屋退回 housePool

action：`demolish_choose { cellId | null }`（null = 放弃）。

---

## 七、#58 锦鲤池 koi_pond

`KoiPond.ts` + `KoiStage.tsx`。舞台展示掷骰动画，掷 2 颗骰子对照：

| 结果 | 奖励 |
|---|---|
| 双 6 | ¥1000 |
| 其他双骰 | ¥500 |
| 7 点 | ¥300 |
| 6 或 8 | ¥100 |
| 其他 | ¥0 |

---

## 八、交易系统（actions/Trade.ts + Modals/TradePanel.tsx）

- 仅当前回合玩家可发起
- 交易内容：现金 + 地产 + 出狱通行证
- 有房屋的地产**不可**交易（必须先卖房）
- 抵押地产可交易（接收方继承抵押状态）

UI：左栏"我方给出"（现金输入 + 地产复选 + 通行证复选），右栏"对方给出"同上；对方选择 接受 / 拒绝。

actions：
```
trade_offer   { toId, giveCash, giveProperties, giveJailCards,
                wantCash, wantProperties, wantJailCards }
trade_respond { tradeId, accept: boolean }
```
服务端用 `pendingTrade: TradeOffer | null` 暂存，校验双方资产充足、地产无房屋后原子交换。

---

## 九、破产处理（actions/Bankrupt.ts）

当玩家需支付但现金不足：
1. 服务端通知客户端进入**自救模式**
2. 玩家尝试卖房、抵押、交易
3. 仍不足则破产：
   - 欠其他玩家：全部资产转让给债主（含地产/抵押/出狱卡）
   - 欠银行：资产归还银行（变为无主，建筑退回 pool）
4. 标记 `bankrupt`，跳过其回合

Socket：`bankrupt { playerId, creditorId? }`。
仅剩 1 名未破产玩家 → `game_over { winnerId }`。

---

## 十、本阶段验证要点

- 7 个趣味格各结果分支与金额正确，移动类（转盘 5/6）正确触发目标格
- 彩票多人分配、奖池清空正确
- 交易资产校验与原子交换，抵押状态继承正确
- 破产资产转移（对玩家/对银行）与建筑回收正确，胜负判定触发
