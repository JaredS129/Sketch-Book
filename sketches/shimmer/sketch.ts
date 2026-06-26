import "q5";

const W = 600;
const H = 600;
const CELL = 20;
const GAP = 0;
const ANIM_MS = 6400;
const STAGGER = 0.15;

// CMYK process colors — configure here
const COLOR_C = "#CCFFCC";
const COLOR_M = "#FFCCFF";
const COLOR_Y = "#CCFFFF";
const COLOR_K = "#CCCCCC";
const COLOR_BG = "#999999";

// Pure CMY at half brightness for the offscreen gradient. One channel is always
// zero so the CMY bias is strong (~0.5) and distinct per hue. Screen-compositing
// pure CMY layers accumulates correctly — overlapping cyan stays cyan, not white.
const CMY_MAX = 0.5;
const CMY_THRESHOLD = 0.02;

// Black is the identity for additive (lighter) blending — settled stops
// contribute nothing to the combined offscreen canvas.
const GRAD_NEUTRAL: [number, number, number] = [0, 0, 0];

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const s =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

type Anim = { x: number; y: number; startTime: number };

export default function sketch(q: Q5): void {
  const cC = parseHex(COLOR_C);
  const cM = parseHex(COLOR_M);
  const cY = parseHex(COLOR_Y);
  const cK = parseHex(COLOR_K);

  // Offscreen-only: pure CMY at half brightness. Decoupled from display colors
  // so the gradient signal is strong and distinct without affecting cell output.
  const oC: [number, number, number] = [0, 128, 128];
  const oM: [number, number, number] = [128, 0, 128];
  const oY: [number, number, number] = [128, 128, 0];

  // Gradient cycles C → M → Y → C with no neutral separators.
  // Each stop lerps toward GRAD_NEUTRAL (black) as the animation settles.
  const STOPS: Array<{ pos: number; color: [number, number, number] }> = [
    { pos: 0, color: oC },
    { pos: 0.33, color: oM },
    { pos: 0.67, color: oY },
    { pos: 1.0, color: oC },
  ];

  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = H;
  const offCtx = offscreen.getContext("2d")!;

  let animations: Anim[] = [];
  let lastSpawnX = -Infinity;
  let lastSpawnY = -Infinity;
  const DRAG_MIN_DIST = 25;

  const spawnAt = (x: number, y: number) => {
    animations.push({ x, y, startTime: performance.now() });
    lastSpawnX = x;
    lastSpawnY = y;
  };

  q.setup = async () => {
    await q.Canvas(W, H);
    spawnAt(W / 2, H / 2);
  };

  q.mousePressed = () => {
    spawnAt(q.mouseX, q.mouseY);
  };

  q.draw = () => {
    const now = performance.now();

    // Spawn a new animation along the drag path every DRAG_MIN_DIST pixels
    if (q.mouseIsPressed) {
      const dx = q.mouseX - lastSpawnX;
      const dy = q.mouseY - lastSpawnY;
      if (Math.hypot(dx, dy) >= DRAG_MIN_DIST) spawnAt(q.mouseX, q.mouseY);
    }

    // Drop fully settled animations from the front, keeping at least one
    while (animations.length > 1 && now - animations[0]!.startTime >= ANIM_MS) {
      animations.shift();
    }

    // Draw all active gradients onto the offscreen canvas with additive blending.
    // Circles that haven't started yet (radius ≤ 1) are skipped.
    offCtx.clearRect(0, 0, W, H);
    offCtx.globalCompositeOperation = "screen";

    for (const anim of animations) {
      const globalT = Math.min((now - anim.startTime) / ANIM_MS, 1);
      const radius = 800 * easeOutExpo(globalT);
      if (radius <= 1) continue;

      const grad = offCtx.createRadialGradient(
        anim.x,
        anim.y,
        0,
        anim.x,
        anim.y,
        radius,
      );

      STOPS.forEach((stop, i) => {
        const delay = i * STAGGER;
        const stopT = easeOutExpo(
          Math.max(0, Math.min(1, (globalT - delay) / (1 - delay))),
        );
        grad.addColorStop(stop.pos, lerpRgb(stop.color, GRAD_NEUTRAL, stopT));
      });

      offCtx.save();
      offCtx.beginPath();
      offCtx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
      offCtx.clip();
      offCtx.fillStyle = grad;
      offCtx.fillRect(0, 0, W, H);
      offCtx.restore();
    }

    offCtx.globalCompositeOperation = "source-over";

    const { data } = offCtx.getImageData(0, 0, W, H);
    q.background(COLOR_BG);

    const halfCell = CELL / 2;
    for (let row = 0; row * (CELL + GAP) < H; row++) {
      for (let col = 0; col * (CELL + GAP) < W; col++) {
        const cellX = col * (CELL + GAP);
        const cellY = row * (CELL + GAP);
        const cx = Math.floor(cellX + halfCell);
        const cy = Math.floor(cellY + halfCell);

        q.ctx.save();
        q.ctx.translate(cellX + halfCell, cellY + halfCell);

        const idx = (Math.min(cy, H - 1) * W + Math.min(cx, W - 1)) * 4;
        const r = (data[idx] ?? 0) / 255;
        const g = (data[idx + 1] ?? 0) / 255;
        const b = (data[idx + 2] ?? 0) / 255;

        // How strongly each CMY primary is expressed at this pixel
        const cyanStr = Math.max(0, (g + b) / 2 - r);
        const magentaStr = Math.max(0, (r + b) / 2 - g);
        const yellowStr = Math.max(0, (r + g) / 2 - b);
        const dominant = Math.max(cyanStr, magentaStr, yellowStr);

        if (dominant > CMY_THRESHOLD) {
          // Raise each CMY weight to a high power before normalising — same
          // technique as the shimmer, creates tight color zones with sharp edges.
          const pwC = Math.pow(cyanStr, 32);
          const pwM = Math.pow(magentaStr, 32);
          const pwY = Math.pow(yellowStr, 128);
          const pTotal = pwC + pwM + pwY;
          const wC = pwC / pTotal;
          const wM = pwM / pTotal;
          const wY = pwY / pTotal;
          const t = Math.min(dominant / CMY_MAX, 1);

          // All three axis rotations applied simultaneously, each weighted by
          // its CMY component — cells in transition zones get compound motion.
          const angleZ = (yellowStr / CMY_MAX) * 1.5;
          const angleY = (magentaStr / CMY_MAX) * 1.5;
          const angleX = (cyanStr / CMY_MAX) * 1.5;

          q.ctx.rotate(angleZ);
          q.ctx.scale(Math.cos(angleY), Math.cos(angleX));

          // Specular shimmer: sin(angle*2) peaks at exactly 45° on each axis
          // and is zero at 0° and 90°. Power 32 keeps the flash very tight.
          const shimmer = Math.max(
            Math.pow(Math.max(0, Math.sin(angleX * 2)), 32),
            Math.pow(Math.max(0, Math.sin(angleY * 2)), 32),
            Math.pow(Math.max(0, Math.sin(angleZ * 2)), 32),
          );

          // 3-way CMY color blend lerped toward COLOR_K, then flashed to white
          const baseR = Math.round(
            (cC[0] * wC + cM[0] * wM + cY[0] * wY) * t + cK[0] * (1 - t),
          );
          const baseG = Math.round(
            (cC[1] * wC + cM[1] * wM + cY[1] * wY) * t + cK[1] * (1 - t),
          );
          const baseB = Math.round(
            (cC[2] * wC + cM[2] * wM + cY[2] * wY) * t + cK[2] * (1 - t),
          );
          q.ctx.fillStyle = `rgb(${Math.round(
            baseR + (255 - baseR) * shimmer,
          )},${Math.round(baseG + (255 - baseG) * shimmer)},${Math.round(
            baseB + (255 - baseB) * shimmer,
          )})`;
        } else {
          q.ctx.fillStyle = COLOR_K;
        }

        q.ctx.fillRect(-halfCell, -halfCell, CELL, CELL);
        q.ctx.restore();
      }
    }
  };
}
