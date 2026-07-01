# 中国城市大富翁 · 联机 3D 大富翁

60 格 · 2~6 人 · 远程联机 · 真 3D 棋盘
技术栈：React 18 + TypeScript + React Three Fiber + Socket.IO + Express + Zustand + Tailwind

## 分阶段开发文档

完整设计文档拆分在 [docs/](docs/)，按开发优先级分四阶段：

- [phase1-core.md](docs/phase1-core.md) — 核心可玩（含全项目共享基础：类型 / 地图数据 / Socket 协议 / Store / 3D 规范）
- [phase2-board.md](docs/phase2-board.md) — 完整棋盘（建筑 / 抵押 / 车站 / 公用事业 / 卡牌 / 入狱）
- [phase3-fun.md](docs/phase3-fun.md) — 趣味系统（7 个趣味格 / 交易 / 破产 / 税务）
- [phase4-polish.md](docs/phase4-polish.md) — 打磨（特效 / 断线重连 / 计分 / 响应式 / 音效）

## 启动

```bash
npm install          # 已安装；若 esbuild 报错运行 npm approve-scripts --allow-scripts-pending
npm run dev          # 前后端同时启动：Vite(5173) + Socket.IO 服务端(3001)
```

打开 http://localhost:5173 ，创建房间→复制房间号→另一标签页加入→房主开始游戏。

- 后端端口可用环境变量 `PORT` 覆盖（默认 3001）。
- Vite 已配置 `/socket.io` 代理到后端，开发期无需手动配置跨域。

## 其他命令

```bash
npm run typecheck    # 前后端 TS 类型检查
npm run build        # 生产构建（tsc 服务端 + vite 前端）
npm start            # 运行生产构建
```

## Phase 1 已实现

大厅（创建/加入/等待室）、3D 棋盘（木桌+60格+棋子）、回合制、第一幕掷骰舞台、
第二幕棋子移动动画、第三幕购买/缴租、双骰再掷与三连双骰入狱、基础出狱、侧边栏玩家卡片与事件记录。

> 说明：3D 格子文字与彩色 emoji 用 drei `<Html>` DOM 覆盖渲染，保证中文与彩色 emoji 正常显示。
