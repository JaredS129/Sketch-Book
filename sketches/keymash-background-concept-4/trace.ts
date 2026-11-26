import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */

const ROTATIONS = [-90, -45, 0, 45, 90];

export class Trace {
  private p: p5;
  initPos: "L" | "l" | "R" | "r" | "T" | "t" | "B" | "b";
  segmentAmt: number;
  traceAmt: number;

  constructor(
    p: p5,
    initPos: "L" | "l" | "R" | "r" | "T" | "t" | "B" | "b",
    segmentAmt: number,
    traceAmt: number,
  ) {
    this.p = p;
    this.initPos = initPos.toUpperCase() as "L" | "R" | "T" | "B";
    this.segmentAmt = segmentAmt;
    this.traceAmt = traceAmt;
  }

  /** Draws onto the main canvas by default, or onto any p5 renderer (e.g. a p5.Graphics). */
  drawTrace(target: { line: p5["line"] } = this.p) {
    const { width, height } = this.p;

    // build once
    const start = { x: 0, y: 0 }; // from the initPos switch
    const steps = Array.from({ length: this.segmentAmt }, () => ({
      len: 30 + Math.random() * 150,
      angle: (ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)]! * Math.PI) / 180,
    }));

    switch (this.initPos) {
      case "L":
        start.x = -180;
        start.y = Math.random() * height;
        break;
      case "R":
        start.x = width + 180;
        start.y = Math.random() * height;
        break;
      case "T":
        start.x = Math.random() * width;
        start.y = -180;
        break;
      case "B":
        start.x = Math.random() * width;
        start.y = height + 180;
        break;
    }

    for (let j = 0; j < this.traceAmt; j++) {
      const shift = j * 10;
      const horizontal = this.initPos === "T" || this.initPos === "B";
      let cx = start.x + (horizontal ? shift : 0);
      let cy = start.y + (horizontal ? 0 : shift);
      for (const { len, angle } of steps) {
        // base offset (ox, oy) from initPos and len, then rotate as you do now
        let offsetX: number = 0;
        let offsetY: number = 0;
        switch (this.initPos) {
          case "L":
            offsetX = len;
            break;
          case "R":
            offsetX = -len;
            break;
          case "T":
            offsetY = len;
            break;
          case "B":
            offsetY = -len;
            break;
        }

        // Rotate the segment's end point around (currentX, currentY)
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nx = cx + offsetX * cos - offsetY * sin;
        const ny = cy + offsetX * sin + offsetY * cos;

        target.line(cx, cy, nx, ny);
        cx = nx;
        cy = ny;
      }
    }
  }
}
