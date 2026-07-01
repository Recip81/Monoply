// #8 幸运转盘：随机 1~8 结果。
export interface WheelOutcome {
  result: number; // 1~8
  label: string;
  cash?: number; // 现金变动
  move?: number; // 移动格数（正前进/负后退），移动后触发目标格
}

export function spinWheel(): WheelOutcome {
  const r = 1 + Math.floor(Math.random() * 8);
  switch (r) {
    case 1:
      return { result: 1, label: "大吉", cash: 300 };
    case 2:
      return { result: 2, label: "中吉", cash: 150 };
    case 3:
      return { result: 3, label: "小吉", cash: 50 };
    case 4:
      return { result: 4, label: "平安无事" };
    case 5:
      return { result: 5, label: "前进 3 格", move: 3 };
    case 6:
      return { result: 6, label: "后退 3 格", move: -3 };
    case 7:
      return { result: 7, label: "小凶", cash: -100 };
    default:
      return { result: 8, label: "大凶", cash: -250 };
  }
}
