import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import Table from "./Table";
import BoardMesh from "./BoardMesh";
import Cell from "./Cell";
import Building from "./Building";
import SpecialMarker, { isMarkedCell } from "./SpecialMarker";
import PlayerToken from "./PlayerToken";
import CameraController from "./CameraController";
import Effects from "./Effects";
import { mapData } from "@/utils/cellPositions";
import { useGameStore } from "@/stores/gameStore";
import { PLAYER_COLORS, GROUP_COLORS } from "@/utils/constants";

// R3F 入口：木桌 + 64 格棋盘 + 棋子。
export default function GameCanvas() {
  const players = useGameStore((s) => s.players);
  const board = useGameStore((s) => s.board);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);

  // 计算同格玩家的偏移序号（同一格内按出现顺序 0,1,2…）
  const offsetByPlayer: Record<string, number> = {};
  const seenAtCell: Record<number, number> = {};
  for (const p of players) {
    const n = seenAtCell[p.position] ?? 0;
    offsetByPlayer[p.id] = n;
    seenAtCell[p.position] = n + 1;
  }

  // owner playerId → 玩家颜色（按玩家在 players 中的 index 取色，与棋子一致）
  const ownerColorOf = (ownerId: string | null): string | null => {
    if (!ownerId) return null;
    const idx = players.findIndex((p) => p.id === ownerId);
    if (idx < 0) return null;
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
  };

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 11, 9], fov: 42 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }: { gl: any }) => {
        // WebGL 上下文丢失后尝试恢复
        gl.domElement.addEventListener("webglcontextlost", (e: Event) => {
          e.preventDefault();
        });
        gl.domElement.addEventListener("webglcontextrestored", () => {
          // 恢复后不做特殊处理，React 自动重新 render
        });
      }}
    >
      <color attach="background" args={["#f0e6d8"]} />

      {/* 灯光：环境光 + 半球光（替代依赖 CDN 的 Environment）+ 主平行光 */}
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#ffffff", "#b9a98c", 0.6]} />
      <directionalLight
        castShadow
        position={[8, 15, 8]}
        intensity={1.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-8, 10, -6]} intensity={0.4} />

      <Suspense fallback={null}>
        <ContactShadows position={[0, 0.02, 0]} opacity={0.35} blur={2.4} scale={16} far={4} />

        <Table />
        <BoardMesh>
          {mapData.map((cell) => (
            <Cell
              key={cell.id}
              cell={cell}
              slot={board[cell.id]}
              ownerColor={ownerColorOf(board[cell.id]?.owner ?? null)}
            />
          ))}
          {mapData.map((cell) =>
            cell.group && board[cell.id]?.buildings ? (
              <Building
                key={`b-${cell.id}`}
                cellId={cell.id}
                level={board[cell.id].buildings}
                color={GROUP_COLORS[cell.group]}
              />
            ) : null
          )}
          {mapData.map((cell) =>
            isMarkedCell(cell) ? <SpecialMarker key={`m-${cell.id}`} cell={cell} /> : null
          )}
          {players.map((p, i) => (
            <PlayerToken
              key={p.id}
              player={p}
              offsetIndex={offsetByPlayer[p.id]}
              isCurrent={i === currentTurnIndex}
              color={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            />
          ))}
        </BoardMesh>

        <CameraController />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
