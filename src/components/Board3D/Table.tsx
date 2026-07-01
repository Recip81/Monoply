// 木桌：棋盘下方的桌面底板
export default function Table() {
  return (
    <mesh receiveShadow position={[0, -0.2, 0]}>
      <boxGeometry args={[18, 0.3, 18]} />
      <meshStandardMaterial color="#6b4226" roughness={0.7} metalness={0.05} />
    </mesh>
  );
}
