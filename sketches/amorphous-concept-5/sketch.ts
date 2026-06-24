import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  p.setup = () => {
    p.createCanvas(800, 800);
  };

  function amorphCirc(x, y, rad, res, r, g, b) {
    p.angleMode(p.DEGREES);
    // noStroke();
    p.noFill();
    for (let i = 0; i < res; i++) {
      p.strokeWeight(p.map(p.sin(i * res), -1, 1, 0, r) * 0.05);
      p.square(
        x + rad * p.cos(p.map(i, 0, res, 0, 360)),
        y + rad * p.sin(p.map(i, 0, res, 0, 360)),
        30,
      );
    }
  }

  p.draw = () => {
    let originX = p.width * 0.5;
    let originY = p.height * 0.5;
    let circAmt = 50;
    let sizeFactor = 8;

    p.background("#2A2D37");
    p.stroke("#EB4E5C");

    for (let i = 0; i < circAmt; i++) {
      amorphCirc(
        originX + sizeFactor * i,
        originY,
        300 - sizeFactor * i,
        circAmt - i * 2,
        50,
        200,
        50,
      );
    }
  };
}
