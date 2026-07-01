# Phase 4 · 打磨

> 依赖 [Phase 1](phase1-core.md) / [Phase 2](phase2-board.md) / [Phase 3](phase3-fun.md)。
> 全部核心玩法已就绪，本阶段做特效、稳定性、计分与适配。

---

## Phase 4 交付清单

- 所有特效（过起点 / 传送 / 金币 / 破产）
- 断线重连
- 计分模式
- 响应式移动端
- 音效（可选）

---

## 一、特效（components/Effects2D + Board3D）

| 特效 | 文件 | 实现 |
|---|---|---|
| 过起点 | `StartPass.tsx` | 3D 金色粒子从起点向上散射；2D 浮动文字 "+¥200" 从底部飘上淡出 |
| 车站传送 | `TeleportAnim.tsx` | 3D 棋子缩放到 0 → 目标位置缩放出现；2D 发光连线连接两站 |
| 金币变动 | `CoinFloat.tsx` | 2D 数字飞入飞出（Framer Motion animate）|
| 破产 | — | 3D 棋子下沉/碎裂；2D 玩家卡片灰化 + 打叉 |
| 通知 | `Toast.tsx` | 通用提示 |
| 转盘 | `WheelStage` 强化 | SVG + CSS rotate，或 3D 圆面贴图旋转 |

后处理 `Effects.tsx`：Bloom（让发光元素突出）+ Vignette（暗角氛围）。

---

## 二、断线重连

- `PlayerState.connected` 标记在线状态
- 断线：保留玩家状态与资产，回合轮到离线玩家时可自动跳过或等待超时
- 重连：服务端发送 `state_sync { state: GameFullState }` 完整同步
- 前端 `socketStore` 维护 `roomId`，重连后用本地标识重新加入房间
- 玩家卡片显示离线状态

---

## 三、计分模式（第二十二部分）

游戏满 60 回合后可选择进入计分模式：

```
得分 = 现金÷10 + 地产面值÷10 + 每栋房×5 + 每家酒店×20
     + 抵押地产面值÷20 + 出狱卡每张×3 + 许愿效果×2
```

`game_over { winnerId, scores? }` 携带各玩家得分，前端展示排行榜。

---

## 四、响应式移动端

- `< 960px`：单栏布局，侧边栏折叠到底部，Header 精简
- Canvas 区域自适应，舞台浮层保持居中
- 触控适配 OrbitControls

---

## 五、音效（可选）

- 掷骰、移动落格、购买、缴租、过起点、入狱、破产、胜利等关键节点音效
- 提供全局静音开关

---

## 六、整体验收

- 2~6 人完整对局可从大厅 → 开局 → 60 回合 → 计分跑通
- 任一玩家断线重连后状态一致
- 移动端单栏布局可玩
- 服务端为权威状态源，所有 action 经 Zod 验证
- 完整可运行项目，`npm run dev` 前后端同时启动
