//@ts-nocheck
import type p5 from "p5";
import { Trace } from "./trace";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  const SIZE = 1200;
  const BAND_PERIOD = 2160; // px between light pulses
  const SPEED = 250; // px/s the pulses travel up the traces
  const COLOR = "rgb(35, 194, 115)";

  let mask: HTMLCanvasElement; // static traces (alpha only)
  let light: HTMLCanvasElement; // per-frame scratch layer
  let lightCtx: CanvasRenderingContext2D;
  let pulsePattern: CanvasPattern;

  const makeCanvas = () => {
    const c = document.createElement("canvas");
    c.width = c.height = SIZE;
    return c;
  };

  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(SIZE, SIZE);

    // Render the (invisible) traces once to use as a mask.
    const trace = new Trace(p, "B", 50, 50);
    const lines = p.createGraphics(SIZE, SIZE);
    lines.pixelDensity(1);
    lines.stroke(255);
    lines.strokeWeight(2);
    trace.drawTrace(lines);
    mask = lines.elt;

    light = makeCanvas();
    lightCtx = light.getContext("2d")!;

    // Tiling strip: solid head fading out to transparent below it
    const strip = document.createElement("canvas");
    strip.width = 1;
    strip.height = BAND_PERIOD;
    const sctx = strip.getContext("2d")!;
    const g = sctx.createLinearGradient(0, 0, 0, BAND_PERIOD);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.002, "rgba(0,0,0,1)");
    g.addColorStop(0.3, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 1, BAND_PERIOD);
    pulsePattern = lightCtx.createPattern(strip, "repeat")!;
  };

  p.draw = () => {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const t = (p.millis() / 1000) * SPEED;

    // 1. Solid colour
    lightCtx.globalCompositeOperation = "source-over";
    lightCtx.fillStyle = COLOR;
    lightCtx.fillRect(0, 0, SIZE, SIZE);

    // 2. Keep only the travelling pulses (moving up the canvas)
    const offset = t % BAND_PERIOD;
    lightCtx.globalCompositeOperation = "destination-in";
    lightCtx.save();
    lightCtx.translate(0, -offset);
    lightCtx.fillStyle = pulsePattern;
    lightCtx.fillRect(0, offset, SIZE, SIZE);
    lightCtx.restore();

    // 3. Restrict the light to the traces
    lightCtx.drawImage(mask, 0, 0);

    p.background(18);
    ctx.drawImage(light, 0, 0);
  };
}
