import { useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { cellPositions } from "@/utils/cellPositions";

// 摄像机控制：自由旋转/缩放/平移，限制不能翻到棋盘下方。
// 视角跟随（仅移动期间）：换玩家或当前玩家位置变化时，相机焦点平滑锁定并平移到
// 当前玩家所在格；一旦到达目的地（焦点足够接近目标格），解除锁定，玩家可自由移动视角。
export default function CameraController() {
  const controlsRef = useRef<any>(null);
  const players = useGameStore((s) => s.players);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);

  const current = players[currentTurnIndex];

  // 跟随状态：换玩家/位置变化时启用，到达目标后关闭
  const following = useRef(false);
  const prevPos = useRef<number>(current?.position ?? 0);
  const prevTurn = useRef<number>(currentTurnIndex);

  // 检测「换玩家」或「当前玩家位置变化」→ 启用跟随
  if (current) {
    if (currentTurnIndex !== prevTurn.current || current.position !== prevPos.current) {
      following.current = true;
      prevTurn.current = currentTurnIndex;
      prevPos.current = current.position;
    }
  }

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || !current || !following.current) return;

    const cell = cellPositions[current.position];
    if (!cell) return;

    const desired = new THREE.Vector3(cell.x, 0, cell.z);
    const target: THREE.Vector3 = controls.target;

    // 已经足够接近目标格 → 解除跟随，之后允许自由移动
    if (target.distanceTo(desired) < 0.05) {
      following.current = false;
      return;
    }

    // 焦点平滑插值到当前玩家所在格，相机同步平移相同位移（保持观察角度与距离）
    const t = 1 - Math.pow(0.02, delta);
    const before = target.clone();
    target.lerp(desired, t);
    const move = target.clone().sub(before);
    controls.object.position.add(move);

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      maxPolarAngle={Math.PI / 2.2}
      minDistance={5}
      maxDistance={20}
      enableDamping
      dampingFactor={0.05}
    />
  );
}
