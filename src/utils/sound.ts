// 轻量 Web Audio 合成音效：无需音频资源文件，按事件合成短音。
// 提供全局静音开关（持久化到 localStorage）。

type SoundName =
  | "dice" | "move" | "buy" | "rent" | "start" | "jail" | "bankrupt" | "win" | "card" | "coin" | "click"
  // 趣味格
  | "wheel_spin" | "wheel_good" | "wheel_bad"
  | "arena_fight" | "arena_result"
  | "koi_roll" | "koi_win"
  | "lottery_draw" | "lottery_win"
  // 功能操作
  | "build" | "hotel" | "sell" | "mortgage" | "redeem"
  | "teleport" | "tax_pay"
  // 交易
  | "trade_offer" | "trade_accept"
  // 系统
  | "fate_card" | "jail_slam";

const MUTE_KEY = "monopoly_muted";

let ctx: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
})();

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // 浏览器自动暂停策略：用户交互后恢复
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// 播放一个简单的振荡器音符
function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.12,
  delay = 0
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// 上行琶音（胜利/过起点等正向反馈）
function arpeggio(freqs: number[], step = 0.09, type: OscillatorType = "triangle") {
  freqs.forEach((f, i) => tone(f, 0.18, type, 0.1, i * step));
}

export const Sound = {
  isMuted(): boolean {
    return muted;
  },

  toggleMute(): boolean {
    muted = !muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    return muted;
  },

  play(name: SoundName) {
    switch (name) {
      case "dice":
        tone(220, 0.08, "square", 0.08);
        tone(180, 0.08, "square", 0.08, 0.06);
        break;
      case "move":
        tone(440, 0.05, "sine", 0.06);
        break;
      case "buy":
        arpeggio([523, 659, 784], 0.07);
        break;
      case "rent":
        tone(330, 0.12, "sawtooth", 0.09);
        tone(247, 0.16, "sawtooth", 0.09, 0.08);
        break;
      case "coin":
        tone(880, 0.06, "triangle", 0.08);
        tone(1175, 0.08, "triangle", 0.07, 0.05);
        break;
      case "start":
        arpeggio([523, 659, 784, 1047], 0.08);
        break;
      case "card":
        tone(660, 0.08, "triangle", 0.08);
        break;
      case "jail":
        tone(196, 0.2, "sawtooth", 0.1);
        tone(147, 0.3, "sawtooth", 0.1, 0.12);
        break;
      case "bankrupt":
        tone(196, 0.25, "sawtooth", 0.11);
        tone(165, 0.25, "sawtooth", 0.11, 0.14);
        tone(123, 0.4, "sawtooth", 0.11, 0.28);
        break;
      case "win":
        arpeggio([523, 659, 784, 1047, 1319], 0.11);
        break;
      case "click":
        tone(520, 0.04, "square", 0.05);
        break;
      // ── 趣味格 ──
      case "wheel_spin":
        // 转盘快速转动（增大幅度+时长确保可闻）
        tone(600, 0.10, "square", 0.10);
        tone(800, 0.10, "square", 0.10, 0.08);
        tone(1000, 0.10, "square", 0.10, 0.16);
        tone(1200, 0.10, "square", 0.10, 0.24);
        break;
      case "wheel_good":
        arpeggio([523, 659, 784, 1047], 0.10, "triangle");
        break;
      case "wheel_bad":
        tone(196, 0.22, "sawtooth", 0.11);
        tone(165, 0.26, "sawtooth", 0.11, 0.14);
        break;
      case "arena_fight":
        // 战鼓（降低频率让人耳更好捕捉）
        tone(82, 0.14, "square", 0.12);
        tone(82, 0.14, "square", 0.12, 0.18);
        tone(110, 0.14, "square", 0.12, 0.36);
        break;
      case "arena_result":
        arpeggio([523, 659, 784], 0.10, "square");
        break;
      case "koi_roll":
        tone(440, 0.10, "sine", 0.10);
        tone(554, 0.12, "triangle", 0.10, 0.10);
        break;
      case "koi_win":
        arpeggio([523, 659, 784, 1047, 1319], 0.12, "triangle");
        break;
      case "lottery_draw":
        tone(660, 0.10, "square", 0.10);
        tone(880, 0.10, "square", 0.10, 0.10);
        tone(1100, 0.10, "square", 0.10, 0.20);
        break;
      case "lottery_win":
        arpeggio([523, 659, 784, 1047], 0.11, "triangle");
        break;
      // ── 功能操作 ──
      case "build":
        tone(260, 0.10, "square", 0.10);
        tone(330, 0.10, "square", 0.10, 0.10);
        break;
      case "hotel":
        arpeggio([330, 415, 523, 659], 0.10, "square");
        break;
      case "sell":
        tone(440, 0.10, "triangle", 0.10);
        tone(330, 0.10, "triangle", 0.10, 0.10);
        break;
      case "mortgage":
        tone(294, 0.16, "sine", 0.10);
        break;
      case "redeem":
        tone(440, 0.12, "triangle", 0.10);
        tone(523, 0.14, "triangle", 0.10, 0.10);
        break;
      case "teleport":
        tone(880, 0.10, "sine", 0.10);
        tone(1100, 0.10, "sine", 0.10, 0.08);
        tone(1320, 0.12, "sine", 0.10, 0.16);
        break;
      case "tax_pay":
        tone(247, 0.20, "sawtooth", 0.10);
        tone(196, 0.24, "sawtooth", 0.10, 0.12);
        break;
      // ── 交易 ──
      case "trade_offer":
        tone(660, 0.10, "triangle", 0.10);
        tone(880, 0.12, "triangle", 0.10, 0.10);
        break;
      case "trade_accept":
        arpeggio([523, 659, 784], 0.10, "triangle");
        break;
      // ── 系统 ──
      case "fate_card":
        tone(587, 0.12, "triangle", 0.10);
        tone(784, 0.16, "triangle", 0.10, 0.10);
        break;
      case "jail_slam":
        tone(196, 0.22, "sawtooth", 0.12);
        tone(147, 0.28, "sawtooth", 0.12, 0.14);
        tone(110, 0.40, "sawtooth", 0.12, 0.28);
    }
  },
};
