import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  let shapeAmt = 30;
  let shapeSize = 20;

  p.setup = () => {
    p.createCanvas(800, 800);
    p.stroke(20);
    p.fill(220);
  };

  function drawRandomShapeGrid() {
    let xInc = p.width / shapeAmt;
    let yInc = p.height / shapeAmt;

    for (let y = 0; y < shapeAmt; y++) {
      for (let x = 0; x < shapeAmt; x++) {
        p.circle(xInc * x, yInc * y, shapeSize);
      }
    }
  }

  p.draw = () => {
    p.background(20);
    p.angleMode(p.DEGREES);
    shapeSize = p.map(p.mouseX, 0, p.width, 0, 30);

    drawRandomShapeGrid();

    p.push();
    p.translate(p.width * 0.5, p.height * 0.5);
    p.rotate(p.map(p.mouseY, 0, p.height, 0, 20));
    p.translate(-p.width * 0.5, -p.height * 0.5);
    p.fill(20);
    drawRandomShapeGrid();
    p.pop();
  };
}
