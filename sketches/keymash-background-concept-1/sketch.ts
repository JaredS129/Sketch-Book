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
  let vecRes = 33;
  let noiseInit = 100;
  let noiseInc = 0.08;
  let vignette;

  p.setup = () => {
    p.createCanvas(800, 800);
    vecSize = p.floor(p.width / vecRes);
    p.noiseDetail(1);

    const ctx = p.drawingContext;
    const r = p.width * 1.2; // radius reaches the middle of each edge
    vignette = ctx.createRadialGradient(p.width / 2, p.height / 2, 0, p.width / 2, p.height / 2, r);
    vignette.addColorStop(0, "rgba(20,20,20,1)");   // centre: solid background
    vignette.addColorStop(0.4, "rgba(20,20,20,1)"); // stays solid until here
    vignette.addColorStop(1, "rgba(20,20,20,0)");   // fades to clear at the edges
  };

  function drawVectors(zNoiseOff) {
    let xOff = noiseInit,
      yOff = noiseInit;
    
    for (let y = -vecRes ; y < vecRes; y++) {
      xOff = noiseInit;
      for (let x = -vecRes; x < vecRes; x++) {
        let angle = p.noise(xOff, yOff, zNoiseOff) * p.TWO_PI;

        let v = p.createVector(1, 0);
        v.rotate(angle + (y * 0.2));
        p.push();
        p.translate(x * vecSize, y * vecSize);
        p.rect(vecSize * 0.5, 0, v.x * vecSize + vecSize * 0.5, v.y * vecSize);
        p.pop();

        xOff += noiseInc;
      }
      yOff += noiseInc;
    }
  }

  p.draw = () => {
    p.background(20);
    p.push();
    p.stroke(255);
    p.fill(20);
    p.translate(p.width * 0.5, p.height * 0.5);
    p.rotate(p.HALF_PI * 0.5);
    drawVectors(p.frameCount * 0.005);
    p.pop(); // restores the transform so the overlay isn't rotated

    p.drawingContext.fillStyle = vignette;
    p.noStroke();
    p.drawingContext.fillRect(0, 0, p.width, p.height);
  };
}
