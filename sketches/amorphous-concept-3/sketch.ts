//@ts-nocheck
import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */

let canvasWidth = 800;
let canvasHeight = 800;

export default function sketch(p: p5): void {
  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight);
  };

  function amorphCirc(x, y, rad, res, r, g, b, size) {
    p.angleMode(p.DEGREES);
    p.noFill();
    p.strokeWeight(2);
    for (let i = 0; i < res * 3; i++) {
      if (i >= 40) {
        p.circle(
          x + rad * p.cos(p.map(i, 0, res, 0, 360)),
          y + rad * p.sin(p.map(i, 0, res, 0, 360)),
          size + i * p.random(0, 2),
        );
      } else {
        p.circle(
          x + rad * p.cos(p.map(i, 0, res, 0, 360)),
          y + rad * p.sin(p.map(i, 0, res, 0, 360)),
          size + i,
        );
      }
    }
  }

  function glitchSlices() {
    for (let i = 0; i < 10; i++) {
      let y = p.random(canvasHeight);
      let h = p.random(2, 30);

      let offset = p.random(-100, 100);

      p.copy(
        0,
        y,
        canvasWidth,
        h,

        offset,
        y,
        canvasWidth,
        h,
      );
    }
  }

  p.draw = () => {
    let originX = p.width * 0.5;
    let originY = p.height * 0.5;
    let circAmt = 17;
    let sizeFactor = 23;

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
      );
    }

    rgbGlitch();
    p.noLoop();
  };

  function rgbGlitch() {
    let frame = p.get();

    p.blendMode(p.ADD);

    // Red
    p.tint(255, 0, 0, 100);
    p.image(frame, -5, 0);

    // Green
    p.tint(0, 255, 0, 100);
    p.image(frame, 0, 0);

    // Blue
    p.tint(0, 0, 255, 100);
    p.image(frame, 5, 0);

    p.noTint();
    p.blendMode(p.BLEND);
  }
}
