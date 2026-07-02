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
    p.createCanvas(400, 400);
    p.angleMode(p.DEGREES);
  };

  let barWidth = 200;
  let barSize = 20;
  let marginVal = 2;

  function drawOutline(posX, posY, widthVal, sizeVal) {
    let vertRes = 40;
    let size = sizeVal;

    p.beginShape();
    let angleInc = 360 / vertRes;
    for (let i = 0; i <= vertRes; i++) {
      let x = posX + size * p.sin(angleInc * i);
      let y = posY + size * p.cos(angleInc * i);

      if (angleInc * i <= 180) {
        p.vertex(x + widthVal * 0.5, y);
      } else {
        p.vertex(x - widthVal * 0.5, y);
      }
    }
    p.vertex(posX + size * p.sin(0) + widthVal * 0.5, posY + size * p.cos(0));
    p.endShape();
  }

  function drawRhombus(posX, posY, size, slew, startX, finishX) {
    let y = posY;

    let range = finishX - startX;
    let x = startX + ((p.frameCount + posX - startX) % range);

    p.beginShape();
    p.vertex(x, y);
    p.vertex(x + size, y);
    p.vertex(x + size - slew, y + size + marginVal * 2);
    p.vertex(x - slew, y + size + marginVal * 2);
    p.endShape(p.CLOSE);
  }

  function drawScrew(threadSize) {
    let threadSpacing = 8;
    let threadTotalWidth = threadSize + threadSpacing;
    let threadAmt = barWidth / threadTotalWidth + 2;

    let x = p.width * 0.5 - barWidth * 0.5 - threadSize;
    let y = p.height * 0.5 - barSize * 0.5;

    for (let i = 0; i < threadAmt; i++) {
      drawRhombus(
        p.width * 0.5 - barWidth * 0.5 + threadTotalWidth * i,
        p.height * 0.5 - barSize * 0.5 - marginVal,
        barSize,
        barSize,
        p.width * 0.5 - barWidth * 0.7,
        p.width * 0.5 + barWidth * 0.7,
      );
    }
  }

  p.draw = () => {
    p.background(18);
    p.stroke(220);
    p.strokeWeight(4);
    p.fill(220);
    drawScrew(barSize);
    p.noFill();
    drawOutline(p.width * 0.5, p.height * 0.5, barWidth, barSize);
    p.stroke(18);
    drawOutline(p.width * 0.5, p.height * 0.5, barWidth, barSize * 0.8);
    p.strokeWeight(60);
    drawOutline(p.width * 0.5, p.height * 0.5, 200, 51.5);
  };
}
