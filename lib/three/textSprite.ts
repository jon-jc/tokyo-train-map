import * as THREE from "three";

export interface LabelSprite {
  texture: THREE.CanvasTexture;
  /** world width per 1 world height */
  aspect: number;
}

const cache = new Map<string, LabelSprite>();

/**
 * Renders a two-line neon label (romaji + Japanese) to a canvas texture.
 */
export function getLabelSprite(
  key: string,
  name: string,
  nameJa: string,
  accent = "#00f0ff",
): LabelSprite {
  const hit = cache.get(key);
  if (hit) return hit;

  const dpr = 2;
  const padX = 18;
  const nameFont = `600 ${34 * dpr}px Rajdhani, "Noto Sans JP", sans-serif`;
  const jaFont = `700 ${22 * dpr}px "Noto Sans JP", sans-serif`;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = nameFont;
  const wName = measure.measureText(name).width;
  measure.font = jaFont;
  const wJa = measure.measureText(nameJa).width;

  const w = Math.ceil(Math.max(wName, wJa) + padX * 2 * dpr);
  const h = Math.ceil(84 * dpr);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // romaji with neon glow
  ctx.font = nameFont;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14 * dpr;
  ctx.fillStyle = "#eafcff";
  ctx.fillText(name, w / 2, h * 0.32);
  ctx.shadowBlur = 8 * dpr;
  ctx.fillText(name, w / 2, h * 0.32);

  // japanese
  ctx.font = jaFont;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 10 * dpr;
  ctx.fillStyle = accent;
  ctx.fillText(nameJa, w / 2, h * 0.74);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const sprite: LabelSprite = { texture, aspect: w / h };
  cache.set(key, sprite);
  return sprite;
}
