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
  let buff1;
  let buffWidth;
  let buffHeight;
  let buffXCount;
  let buffOverlap;

  let rectWidth;
  let rectHeight;

  p.setup = () => {
    p.createCanvas(600, 600);
    p.noStroke();
    p.angleMode(p.DEGREES);
    p.blendMode(p.ADD);

    buffXCount = 40;

    buffWidth = p.width / buffXCount;
    buffHeight = p.height / buffXCount;
    buffOverlap = buffWidth * 0.9;
    buffWidth += buffOverlap;
    buffHeight += buffOverlap;

    buff1 = p.createGraphics(buffWidth, buffHeight);

    rectWidth = buffWidth * 0.4;
    rectHeight = buffHeight * 0.3;
  };

  function drawRects(buffer) {
    buffer.fill(255, 0, 0);
    buffer.rect(buffWidth * 0.5 - rectWidth * 0.5, 0, rectWidth, rectHeight);

    buffer.fill(0, 255, 0);
    buffer.rect(
      buffWidth - rectHeight,
      buffHeight * 0.5 - rectWidth * 0.5,
      rectHeight,
      rectWidth,
    );

    buffer.fill(0, 0, 255);
    buffer.rect(0, buffHeight * 0.5 - rectWidth * 0.5, rectHeight, rectWidth);

    buffer.fill(255, 0, 0);
    buffer.rect(
      buffWidth * 0.5 - rectWidth * 0.5,
      buffHeight - rectHeight,
      rectWidth,
      rectHeight,
    );
  }

  p.draw = () => {
    p.clear();

    p.background(20);

    drawRects(buff1);

    let rotateAmt = 0;

    for (let i = 0; i < buffXCount; i++) {
      for (let j = 0; j < buffXCount; j++) {
        let x = buffWidth * i - buffOverlap * i;
        let y = buffHeight * j;
        let noiseOffset1 = 1000 + p.frameCount * 0.001;
        let noiseOffset2 = 5000 + p.frameCount * 0.001;

        rotateAmt += p.map(p.noise(noiseOffset1), 0, 1, 0, 30);
        buffOverlap = p.map(p.noise(noiseOffset2), 0, 1, 0, 10);

        // buffXCount += buffOverlap + 1;

        p.push();
        p.translate(x + buffWidth * 0.5, y + buffHeight * 0.5);
        p.rotate(rotateAmt);
        p.imageMode(p.CENTER);
        p.image(buff1, 0, 0);
        p.pop();
      }
    }

    // p.noLoop();
  };
}
