import { useEffect } from "react";
import { initSocket } from "./socket/client";
import { useGameStore } from "./stores/gameStore";
import { useUiStore } from "./stores/uiStore";
import LobbyPage from "./components/Lobby/LobbyPage";
import GamePage from "./components/Game/GamePage";
import PreRoll from "./components/Game/PreRoll";
import Toast from "./components/Effects2D/Toast";
import CoinFloat from "./components/Effects2D/CoinFloat";

export default function App() {
  const started = useGameStore((s) => s.started);
  const preRollPlayers = useUiStore((s) => s.preRollPlayers);

  useEffect(() => {
    initSocket();
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg font-body text-txt">
      {preRollPlayers ? <PreRoll players={preRollPlayers} /> : started ? <GamePage /> : <LobbyPage />}
      <Toast />
      <CoinFloat />
    </div>
  );
}
