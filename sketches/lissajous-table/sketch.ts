//@ts-nocheck

import type p5 from "p5";

export default function sketch(p: p5): void {
  let canvasWidth = 800;
  let canvasHeight = 800;

  let circleAmtX = 10;
  let circleAmtY = 10;
  let padding = 8;

  let circleSize = canvasWidth / (circleAmtX + 1) - padding;
  let XSpacing = canvasWidth / (circleAmtX + 1);
  let YSpacing = canvasHeight / (circleAmtY + 1);

  let xPoints = [];
  let yPoints = [];

  const cycleLength = 720;

  // curves[row][col]
  let curves = [];

  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight);
    p.stroke(220);
    p.angleMode(p.DEGREES);

    for (let row = 0; row < circleAmtY; row++) {
      curves[row] = [];

      for (let col = 0; col < circleAmtX; col++) {
        curves[row][col] = [];
      }
    }
  };

  function drawCircles() {
    for (let i = 1; i <= circleAmtX; i++) {
      p.circle(XSpacing * i + circleSize * 0.5, circleSize * 0.5 + 4, circleSize);

      p.circle(circleSize * 0.5 + 4, YSpacing * i + circleSize * 0.5, circleSize);
    }
  }

  function updateXPoints(frame) {
    let centerY = circleSize * 0.5;

    for (let i = 1; i <= circleAmtX; i++) {
      let x = circleSize * 0.5 * p.sin(frame * i);
      let y = circleSize * 0.5 * p.cos(frame * i);

      let screenX = XSpacing * i + circleSize * 0.5 + x;
      let screenY = centerY + y + 4;

      xPoints[i - 1] = screenX;

      p.push();

      p.strokeWeight(8);
      p.point(screenX, screenY);

      p.strokeWeight(1);
      p.stroke(220, 80);
      p.line(screenX, 0, screenX, canvasHeight);

      p.pop();
    }
  }

  function updateYPoints(frame) {
    let centerX = circleSize * 0.5;

    for (let i = 1; i <= circleAmtY; i++) {
      let x = circleSize * 0.5 * p.sin(frame * i);
      let y = circleSize * 0.5 * p.cos(frame * i);

      let screenX = centerX + x + 4;
      let screenY = YSpacing * i + circleSize * 0.5 + y;

      yPoints[i - 1] = screenY;

      p.push();

      p.strokeWeight(8);
      p.point(screenX, screenY);

      p.strokeWeight(1);
      p.stroke(220, 80);
      p.line(0, screenY, canvasWidth, screenY);

      p.pop();
    }
  }

  function updateCurves() {
    for (let row = 0; row < circleAmtY; row++) {
      for (let col = 0; col < circleAmtX; col++) {
        curves[row][col].push({
          x: xPoints[col],
          y: yPoints[row],
        });
      }
    }
  }

  function drawCurves() {
    p.noFill();
    p.stroke(220);

    for (let row = 0; row < circleAmtY; row++) {
      for (let col = 0; col < circleAmtX; col++) {
        p.beginShape();

        for (const pt of curves[row][col]) {
          p.vertex(pt.x, pt.y);
        }

        p.endShape();
      }
    }
  }

  p.draw = () => {
    // Clear all curves once every complete cycle
    if (p.frameCount % cycleLength === 0) {
      for (let row = 0; row < circleAmtY; row++) {
        for (let col = 0; col < circleAmtX; col++) {
          curves[row][col].length = 0;
        }
      }
    }
    p.background(20);

    drawCircles();

    updateXPoints(p.frameCount);
    updateYPoints(p.frameCount);

    updateCurves();
    drawCurves();
  };
}
