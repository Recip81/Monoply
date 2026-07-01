import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CellDef } from "@shared/types";
import { cellPositions } from "@/utils/cellPositions";
import { getEmojiTexture } from "@/three/emojiTexture";

// 需要立体标识的格子类型（地产由 Building 渲染，这里覆盖功能格/角落格）
const MARKED_TYPES = new Set(["special", "tax", "fate", "fund", "fun", "station", "utility"]);

// 各类型杆子/底座配色
const TYPE_COLOR: Record<string, string> = {
  special: "#e74c3c",
  tax: "#daa520",
  fate: "#8e44ad",
  fund: "#2c3e80",
  fun: "#ff8c42",
  station: "#2d2b55",
  utility: "#2ecc71",
};

export function isMarkedCell(cell: CellDef): boolean {
  return MARKED_TYPES.has(cell.type);
}

// 立体标识：一根杆子顶端立一块 emoji 牌（高度约同酒店），轻微悬浮浮动。
export default function SpecialMarker({ cell }: { cell: CellDef }) {
  const pos = cellPositions[cell.id];
  const ref = useRef<THREE.Group>(null);
  const emojiTex = getEmojiTexture(cell.emoji);
  const color = TYPE_COLOR[cell.type] ?? "#9490b0";

  // 轻微上下浮动（emoji 牌悬于杆子顶端之上，避免重叠）
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 0.42 + Math.sin(t * 2 + cell.id) * 0.02;
  });

  return (
    <group position={[pos.x, 0.05, pos.z]}>
      {/* 杆子（缩短，顶端约 0.26，低于 emoji 牌底部，避免重叠） */}
      <mesh castShadow position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.26, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* 底座 */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.03, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* 顶端 emoji 牌（精灵，始终朝相机） */}
      <group ref={ref} position={[0, 0.42, 0]}>
        <sprite scale={[0.3, 0.3, 0.3]}>
          <spriteMaterial map={emojiTex} transparent />
        </sprite>
      </group>
    </group>
  );
}
