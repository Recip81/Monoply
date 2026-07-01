import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlayerState } from "@shared/types";
import { cellPositions } from "@/utils/cellPositions";
import { getEmojiTexture } from "@/three/emojiTexture";
import { useUiStore } from "@/stores/uiStore";

const STEP_MS = 150; // 每格移动耗时

// 棋子：emoji 精灵（Sprite）+ 3D 底座 + 脉冲光环。
// 移动动画通过内部 displayPos + moveAnim.path 逐格推进，不再是直飞终点。
export default function PlayerToken({
  player,
  offsetIndex,
  isCurrent,
  color,
}: {
  player: PlayerState;
  offsetIndex: number;
  isCurrent: boolean;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  // 逐格移动状态
  const pathRef = useRef<number[]>([]); // 当前移动路径
  const pathIdx = useRef<number>(0); // 已走到的路径序号（0=未开始）
  const stepTimer = useRef<number>(0); // 当前格累计时间(ms)
  // 内部显示位置(逐格推进的目标格,不是 player.position 的直接映射)
  const displayPos = useRef<number>(player.position);
  const lastSeq = useRef<number>(-1); // 上次已加载的移动 seq，用于去重避免重放
  // 传送飞行状态："none" | "shrink"(起飞缩小) | "grow"(落地放大)
  const teleState = useRef<"none" | "shrink" | "grow">("none");
  const teleProgress = useRef<number>(0); // 当前阶段进度 0~1

  // 同格偏移（小圆环排布）
  const angle = (offsetIndex / 6) * Math.PI * 2;
  const ox = Math.cos(angle) * 0.16;
  const oz = Math.sin(angle) * 0.16;

  const emojiTex = getEmojiTexture(player.emoji);

  // 从 uiStore 读 moveAnim：仅当 seq 变化（一次新移动）时加载路径，
  // 避免动画播完后任意重渲染重放旧路径（seq 单调递增，可靠去重）。
  const moveAnim = useUiStore((s) => s.moveAnim);
  if (
    moveAnim &&
    moveAnim.playerId === player.id &&
    moveAnim.path.length > 0 &&
    moveAnim.seq !== lastSeq.current
  ) {
    lastSeq.current = moveAnim.seq;
    pathRef.current = moveAnim.path;
    pathIdx.current = 0;
    stepTimer.current = 0;
  }

  useFrame((state, deltaMs) => {
    const g = groupRef.current;
    if (!g) return;

    // 逐格推进
    const ms = deltaMs * 1000;
    if (pathRef.current.length > 0 && pathIdx.current < pathRef.current.length) {
      stepTimer.current += ms;
      while (
        stepTimer.current >= STEP_MS &&
        pathIdx.current < pathRef.current.length
      ) {
        stepTimer.current -= STEP_MS;
        pathIdx.current += 1;
      }
      // 当前目标格 = 已走到的那格
      const idx = Math.min(pathIdx.current, pathRef.current.length - 1);
      displayPos.current = pathRef.current[idx];
      // 走到最后一格后清除路径，displayPos 停在终点格（即 player.position）
      if (pathIdx.current >= pathRef.current.length) {
        displayPos.current = pathRef.current[pathRef.current.length - 1];
        pathRef.current = [];
        pathIdx.current = 0;
        stepTimer.current = 0;
      }
    } else if (teleState.current === "none") {
      // 无活跃路径时跟随 gameStore 的 position
      // 检测大跨度跳变(传送)：进入飞行动画（先在原地缩小）
      if (player.position !== displayPos.current) {
        const prev = cellPositions[displayPos.current];
        const next = cellPositions[player.position];
        const dist = Math.hypot(prev.x - next.x, prev.z - next.z);
        if (dist > 5) {
          // 传送：启动起飞缩小阶段，落点稍后在 grow 阶段切换
          teleState.current = "shrink";
          teleProgress.current = 0;
        } else {
          displayPos.current = player.position;
        }
      }
    }

    // 传送飞行动画：shrink（原地缩小）→ 切换到目标格 → grow（落地放大）
    const TELE_SPEED = 1.6; // 每秒进度，越小越慢（约 0.6s 每阶段）
    if (teleState.current === "shrink") {
      teleProgress.current = Math.min(1, teleProgress.current + (ms / 1000) * TELE_SPEED);
      g.scale.setScalar(1 - teleProgress.current);
      if (teleProgress.current >= 1) {
        // 缩到最小：瞬移到目标格，转入落地放大
        displayPos.current = player.position;
        const next = cellPositions[displayPos.current];
        g.position.x = next.x + ox;
        g.position.z = next.z + oz;
        teleState.current = "grow";
        teleProgress.current = 0;
      }
      return; // 飞行期间不做常规 lerp
    }
    if (teleState.current === "grow") {
      teleProgress.current = Math.min(1, teleProgress.current + (ms / 1000) * TELE_SPEED);
      g.scale.setScalar(teleProgress.current);
      if (teleProgress.current >= 1) {
        teleState.current = "none";
        g.scale.setScalar(1);
      }
      return;
    }

    const target = cellPositions[displayPos.current];
    const tx = target.x + ox;
    const tz = target.z + oz;

    // lerp 平滑移动
    const t = 1 - Math.pow(0.005, ms / 16);
    g.position.x = THREE.MathUtils.lerp(g.position.x, tx, t);
    g.position.z = THREE.MathUtils.lerp(g.position.z, tz, t);
    g.scale.setScalar(1);

    // 光环脉冲
    if (ringRef.current && isCurrent) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
  });

  if (player.bankrupt) return null;

  const start = cellPositions[displayPos.current];

  return (
    <group ref={groupRef} position={[start.x + ox, 0.18, start.z + oz]}>
      <sprite position={[0, 0.4, 0]} scale={[0.4, 0.4, 0.4]}>
        <spriteMaterial map={emojiTex} transparent />
      </sprite>
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.08, 20]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      {isCurrent && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <ringGeometry args={[0.16, 0.24, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} />
        </mesh>
      )}
    </group>
  );
}
