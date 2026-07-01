import { BOARD_SIZE } from "@/utils/cellPositions";

// 棋盘底板：带厚度的方板，放在桌面上方
export default function BoardMesh({ children }: { children?: React.ReactNode }) {
  return (
    <group position={[0, 0, 0]}>
      {/* 板面 */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[BOARD_SIZE, 0.15, BOARD_SIZE]} />
        <meshStandardMaterial color="#f5ede0" roughness={0.95} metalness={0} />
      </mesh>
      {/* 边框（略大一圈，深色） */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[BOARD_SIZE + 0.4, 0.12, BOARD_SIZE + 0.4]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} metalness={0} />
      </mesh>
      {children}
    </group>
  );
}
