import * as THREE from "three";

// 为每个格子生成一张 CanvasTexture（emoji + 名称），缓存复用。
// 用 canvas 2D 绘制，原生支持中文与彩色 emoji，且只生成一次，
// 避免 drei <Html> 每帧重算 DOM 位置带来的严重性能开销。

const cache = new Map<string, THREE.CanvasTexture>();

const SIZE = 256; // 贴图分辨率

export function getCellTexture(
  emoji: string,
  name: string,
  groupColor: string | null
): THREE.CanvasTexture {
  const key = `${emoji}|${name}|${groupColor ?? ""}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // 背景透明
  ctx.clearRect(0, 0, SIZE, SIZE);

  // 顶部色条（地产组色）
  if (groupColor) {
    ctx.fillStyle = groupColor;
    ctx.fillRect(SIZE * 0.1, SIZE * 0.08, SIZE * 0.8, SIZE * 0.14);
  }

  // emoji
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "90px sans-serif";
  ctx.fillText(emoji, SIZE / 2, SIZE * 0.46);

  // 名称
  ctx.fillStyle = "#2d2b55";
  ctx.font = "bold 38px 'Noto Sans SC', sans-serif";
  ctx.fillText(name, SIZE / 2, SIZE * 0.8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}
