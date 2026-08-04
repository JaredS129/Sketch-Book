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
  let vecSize;
  let vecRes = 40;
  let noiseInit = 100;
  let noiseInc = 0.08;

  p.setup = () => {
    p.createCanvas(800, 800);
    vecSize = p.floor(p.width / vecRes);
    p.noiseDetail(1);
  };

  function drawVectors(w, h, zNoiseOff) {
    let xOff = noiseInit,
      yOff = noiseInit;

    for (let y = 0; y < vecRes; y++) {
      xOff = noiseInit;
      for (let x = 0; x < vecRes; x++) {
        let angle = p.noise(xOff, yOff, zNoiseOff) * p.TWO_PI;

        let v = p.createVector(1, 0);
        v.rotate(angle);

        p.push();
        p.translate(x * vecSize, y * vecSize);
        p.circle(vecSize * 0.5, 0, v.x * vecSize + vecSize * 0.5, v.y * vecSize);
        p.pop();

        xOff += noiseInc;
      }
      yOff += noiseInc;
    }
  }

  p.draw = () => {
    p.background(20);
    p.stroke(30);
    // p.fill(30);
      
    drawVectors(p.width, p.height, p.frameCount * 0.005);
    // p.noLoop();
  };
}
