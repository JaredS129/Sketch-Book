//@ts-nocheck

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

  function amorphCirc(x, y, rad, res, r, g, b, size, colorInit) {
    p.angleMode(p.DEGREES);
    p.noFill();
    p.strokeWeight(2);

    let colorInc = colorInit;

    for (let i = 0; i < res * 3; i++) {
      switch (colorInc) {
        case 0:
          p.stroke(255, 0, 0);
          break;

        case 1:
          p.stroke(0, 255, 0);
          break;

        case 2:
          p.stroke(0, 0, 255);
          break;
      }

      p.circle(
        x + rad * p.cos(p.map(i, 0, res, 0, 360)),
        y + rad * p.sin(p.map(i, 0, res, 0, 360)),
        size + i,
      );
      if (colorInc >= 2) {
        colorInc = 0;
      } else {
        colorInc++;
      }
    }
  }

  p.draw = () => {
    let originX = p.width * 0.5;
    let originY = p.height * 0.5;
    let circAmt = 17;
    let sizeFactor = 23;
    let radOffset = 5;

    p.blendMode(p.ADD);

    p.background(20);

    p.stroke("#F0D6A8");

    for (let i = 0; i < circAmt; i++) {
      amorphCirc(
        originX + sizeFactor * i,
        originY,
        300 - sizeFactor * i,
        circAmt - i * 2,
        50,
        200,
        50,
        20,
        0,
      );
    }

    for (let i = 0; i < circAmt; i++) {
      amorphCirc(
        originX + sizeFactor * i,
        originY,
        300 - sizeFactor * i + radOffset,
        circAmt - i * 2,
        50,
        200,
        50,
        20,
        2,
      );
    }

    p.noLoop();
  };
}
