import { useState } from "react";
import type { CellDef, PropertyState } from "@shared/types";
import { cellPositions, CELL_WORLD_SIZE } from "@/utils/cellPositions";
import { GROUP_COLORS } from "@/utils/constants";
import { useUiStore } from "@/stores/uiStore";
import { getCellTexture } from "@/three/cellTexture";

const CELL_W = CELL_WORLD_SIZE * 0.95;

// 单个格子：薄盒 + 顶部色条（地产组）+ 文字贴图（CanvasTexture，一次生成不每帧重算）。
// ownerColor：该格当前拥有者的玩家色（无主为 null），用于整格染色以标识归属。
export default function Cell({
  cell,
  slot,
  ownerColor,
}: {
  cell: CellDef;
  slot?: PropertyState;
  ownerColor?: string | null;
}) {
  const pos = cellPositions[cell.id];
  const [hovered, setHovered] = useState(false);
  const openDetail = useUiStore((s) => s.openPropertyDetail);

  const groupColor = cell.group ? GROUP_COLORS[cell.group] : null;
  const owned = slot?.owner != null;

  const isCorner = cell.id === 0 || cell.id === 15 || cell.id === 30 || cell.id === 45;
  // 有主：整格染玩家色；无主：角落格略深，普通格米白
  const baseColor = owned && ownerColor ? ownerColor : isCorner ? "#efe4d2" : "#fffdf8";

  const buyable =
    cell.type === "property" || cell.type === "station" || cell.type === "utility";

  // 文字统一朝外：所有格子文字朝棋盘外侧（按所在边旋转，center-facing 的反向）
  const rotY = [Math.PI, Math.PI / 2, 0, -Math.PI / 2][pos.edge];
  const texture = getCellTexture(cell.emoji, cell.name, groupColor);

  return (
    <group
      position={[pos.x, 0.08 + (hovered ? 0.04 : 0), pos.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (buyable) openDetail(cell.id);
      }}
    >
      {/* 格子面（有主时整格染玩家色） */}
      <mesh receiveShadow>
        <boxGeometry args={[CELL_W, 0.05, CELL_W]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.85}
          emissive={hovered ? "#ff8c42" : owned && ownerColor ? ownerColor : "#000000"}
          emissiveIntensity={hovered ? 0.25 : owned && ownerColor ? 0.25 : 0}
        />
      </mesh>

      {/* 文字贴图（平铺在格子面上方） */}
      <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, rotY]}>
        <planeGeometry args={[CELL_W * 0.92, CELL_W * 0.92]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>

      {/* 拥有边框：沿格子四周一圈玩家色细框，加强归属辨识 */}
      {owned && ownerColor && (
        <mesh position={[0, 0.055, 0]}>
          <boxGeometry args={[CELL_W, 0.02, CELL_W]} />
          <meshBasicMaterial color={ownerColor} wireframe />
        </mesh>
      )}
    </group>
  );
}
