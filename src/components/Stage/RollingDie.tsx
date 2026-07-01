import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// 通用滚动骰子：收到最终点数前快速跳变随机数约 0.8s 再定格（带缩放弹跳）。
// 趣味格（擂台/锦鲤/彩票）与第一幕骰子共用此视觉。
export default function RollingDie({
  value,
  size = 56,
}: {
  value: number | null;
  size?: number;
}) {
  // 初始为 null：保证首次挂载（outcome 一来就带最终点数）也会触发滚动动画
  const [display, setDisplay] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (value != null && prev.current == null) {
      setRolling(true);
      let ticks = 0;
      const iv = setInterval(() => {
        setDisplay(1 + Math.floor(Math.random() * 6));
        ticks += 1;
        if (ticks >= 10) {
          clearInterval(iv);
          setDisplay(value);
          setRolling(false);
        }
      }, 80);
      prev.current = value;
      return () => clearInterval(iv);
    }
    setDisplay(value);
    prev.current = value;
  }, [value]);

  return (
    <motion.div
      animate={
        value == null
          ? { rotate: [0, 360] }
          : rolling
          ? { rotate: [0, 360], scale: [1, 1.12, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={
        value == null
          ? { repeat: Infinity, duration: 0.6, ease: "linear" }
          : rolling
          ? { repeat: Infinity, duration: 0.18, ease: "linear" }
          : { type: "spring", stiffness: 260, damping: 12 }
      }
      className="rounded-2xl bg-surface shadow-card flex items-center justify-center font-num font-bold text-txt"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {display ?? "?"}
    </motion.div>
  );
}
