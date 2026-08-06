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
  let canvasWidth = 1050;
  let canvasHeight = 1050;

  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight);
    p.pixelDensity(4);
    p.angleMode(p.DEGREES);
  };

  function amorphCirc(x, y, rad, res, size, frame) {
    let animRate = frame * 0.7;
    let pulse = p.sin(animRate);
    let cos2 = p.cos(animRate * 2);
    let sin3 = p.sin(animRate * 3);

    rad += p.cos(animRate * 2) * 50;
    size += p.sin(animRate * 3) * 50;

    p.noFill();
    p.strokeWeight(2);
    for (let i = 0; i < res * 3; i++) {
      let angle = i * (360 / res);
      let cx = p.cos(angle);
      let sy = p.sin(angle);
      p.circle(x + rad * cx, y + rad * sy, size + i * pulse);
    }
  }

  const circAmt = 10;
  const sizeFactor = 20;

  p.draw = () => {
    let originX = p.width * 0.5;
    let originY = p.height * 0.55;

    p.translate(p.width * 0.5 + sizeFactor, p.height * 0.55);
    p.rotate(p.frameCount * 0.1);
    p.translate(p.width * -0.5 - sizeFactor, p.height * -0.55);

    const animRate = p.frameCount * 0.7;

    p.background(20);

    p.stroke("#F0D6A8");

    for (let i = 0; i < circAmt; i++) {
      amorphCirc(
        originX + sizeFactor * i,
        originY,
        300 - sizeFactor * i,
        circAmt - i * p.cos(p.frameCount * 0.2) * 0.2,
        30,
        animRate,
      );
    }

    p.noFill();

    // rgbGlitch();
    // saveCanvas("frame", "png");
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
