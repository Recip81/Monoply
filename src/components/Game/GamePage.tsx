import GameCanvas from "../Board3D/GameCanvas";
import Header from "./Header";
import Sidebar from "./Sidebar";
import StageOverlay from "../Stage/StageOverlay";
import PropertyDetail from "../Modals/PropertyDetail";
import PropertyManage from "../Modals/PropertyManage";
import TradePanel from "../Modals/TradePanel";
import TradeResponse from "../Modals/TradeResponse";
import Scoreboard from "../Modals/Scoreboard";
import RescuePanel from "../Modals/RescuePanel";

// 游戏主页面：Header + （Canvas + 舞台覆盖） + 右侧栏（含操作面板）
export default function GamePage() {
  return (
    <div className="w-full h-full flex flex-col">
      <Header />
      {/* 大屏左右布局；< lg(1024px) 改为上下单栏，侧栏折到底部 */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* 主区域：3D 棋盘 + 舞台覆盖 */}
        <div className="relative flex-1 min-w-0 min-h-0">
          <GameCanvas />
          <StageOverlay />
        </div>
        {/* 侧栏 */}
        <Sidebar />
      </div>
      <PropertyDetail />
      <PropertyManage />
      <TradePanel />
      <TradeResponse />
      <Scoreboard />
      <RescuePanel />
    </div>
  );
}
