import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingLevel } from "@shared/types";
import { cellPositions, CELL_WORLD_SIZE } from "@/utils/cellPositions";

// 1~4 栋房屋在格子内的排布位置
function housePosition(i: number, total: number): [number, number, number] {
  const gap = CELL_WORLD_SIZE * 0.22;
  // 单排居中排列
  const offset = (i - (total - 1) / 2) * gap;
  return [offset, 0, 0];
}

// 单栋小房屋（屋顶 cone + 墙壁 box）
function House({ wallColor, roofColor }: { wallColor: string; roofColor: string }) {
  return (
    <group scale={CELL_WORLD_SIZE * 0.9}>
      <mesh castShadow position={[0, 0.18, 0]}>
        <coneGeometry args={[0.13, 0.16, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[0.18, 0.13, 0.18]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

// 酒店（较高 box + 发光窗户）
function Hotel({ color }: { color: string }) {
  return (
    <group scale={CELL_WORLD_SIZE * 0.95}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.26, 0.4, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      {/* 屋顶 */}
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.24]} />
        <meshStandardMaterial color="#2d2b55" roughness={0.5} />
      </mesh>
      {/* 窗户：两排发光小方块 */}
      {[0.12, 0.24].map((y) =>
        [-0.06, 0.06].map((x) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.105]}>
            <boxGeometry args={[0.05, 0.06, 0.01]} />
            <meshStandardMaterial
              color="#ffd93d"
              emissive="#ffd93d"
              emissiveIntensity={0.8}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

// 格子上的建筑组：根据等级渲染房屋或酒店，入场缩放弹入。
export default function Building({
  cellId,
  level,
  color,
}: {
  cellId: number;
  level: BuildingLevel;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pos = cellPositions[cellId];

  // 入场缩放动画（scale 0 → 1）
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = 1 - Math.pow(0.002, delta);
    g.scale.x = THREE.MathUtils.lerp(g.scale.x, 1, t);
    g.scale.y = THREE.MathUtils.lerp(g.scale.y, 1, t);
    g.scale.z = THREE.MathUtils.lerp(g.scale.z, 1, t);
  });

  if (level < 1) return null;

  // 深一点的屋顶色
  const roofColor = new THREE.Color(color).multiplyScalar(0.7).getStyle();

  return (
    <group ref={groupRef} position={[pos.x, 0.13, pos.z]} scale={0.01}>
      {level === 5 ? (
        <Hotel color={color} />
      ) : (
        Array.from({ length: level }).map((_, i) => {
          const [hx, , hz] = housePosition(i, level);
          return (
            <group key={i} position={[hx, 0, hz]}>
              <House wallColor={color} roofColor={roofColor} />
            </group>
          );
        })
      )}
    </group>
  );
}
