import * as THREE from "three";

// 为 emoji 生成 CanvasTexture，缓存复用。
// 用于棋子精灵（Sprite），替代 drei <Html> 的 DOM 渲染以提升性能。

const cache = new Map<string, THREE.CanvasTexture>();

const SIZE = 128;

export function getEmojiTexture(emoji: string): THREE.CanvasTexture {
  const cached = cache.get(emoji);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "96px sans-serif";
  ctx.fillText(emoji, SIZE / 2, SIZE / 2 + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(emoji, tex);
  return tex;
}
