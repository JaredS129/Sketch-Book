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

  function amorphCirc(x, y, rad, res, r, g, b) {
    p.angleMode(p.DEGREES);
    p.fill(20);
    for (let i = 0; i < res; i++) {
      p.circle(
        x + rad * p.cos(p.map(i, 0, res, 0, 360)),
        y + rad * p.sin(p.map(i, 0, res, 0, 360)),
        20,
      );
    }
  }

  function amorphVert(x, y, rad, res, r, g, b) {
    p.angleMode(p.DEGREES);
    p.noFill();
    p.beginShape();
    for (let i = 0; i < res; i++) {
      p.vertex(
        x + rad * p.cos(p.map(i, 0, res, 0, 360)),
        y + rad * p.sin(p.map(i, 0, res, 0, 360)),
      );
    }
    p.endShape();
  }

  p.draw = () => {
    let originX = p.width * 0.5;
    let originY = p.height * 0.5;
    let circAmt = 20;
    let sizeFactor = 20;
    let offset = 2;

    p.background(20);
    p.strokeWeight(3);
    p.stroke(255, 0, 0);
    p.blendMode(p.ADD);

    for (let i = 0; i < circAmt; i++) {
      amorphVert(
        originX + sizeFactor * i,
        originY,
        300 - sizeFactor * i,
        circAmt - i * 2,
        50,
        200,
        50,
      );
    }

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

    p.stroke(0, 255, 0);

    for (let i = 0; i < circAmt; i++) {
      amorphVert(
        originX + sizeFactor * i - offset,
        originY - offset,
        300 - sizeFactor * i + offset,
        circAmt - i * 2,
        50,
        200,
        50,
      );
    }

    for (let i = 0; i < circAmt; i++) {
      amorphCirc(
        originX + sizeFactor * i - offset,
        originY - offset,
        300 - sizeFactor * i + offset,
        circAmt - i * 2,
        50,
        200,
        50,
      );
    }

    p.stroke(0, 0, 255);

    for (let i = 0; i < circAmt; i++) {
      amorphVert(
        originX + sizeFactor * i - offset * 2,
        originY - offset * 2,
        300 - sizeFactor * i + offset * 2,
        circAmt - i * 2,
        50,
        200,
        50,
      );
    }

    for (let i = 0; i < circAmt; i++) {
      amorphCirc(
        originX + sizeFactor * i - offset * 2,
        originY - offset * 2,
        300 - sizeFactor * i + offset * 2,
        circAmt - i * 2,
        50,
        200,
        50,
      );
    }

    p.noLoop();
  };
}
