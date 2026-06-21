import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  const W: boolean = false; // WALL
  const O: boolean = true; // OPEN

  const MAP: boolean[][] = [
    [W, W, W, W, W, W],
    [W, O, W, O, O, W],
    [W, O, W, W, O, W],
    [W, O, O, O, O, W],
    [W, O, O, W, O, W],
    [W, W, W, W, W, W],
  ];

  const BLOCK_SIZE: number = 100;
  const HORIZONTAL_RESOLUTION: number = 320;
  const FOV: number = 90;
  const ROTATION_SPEED: number = 0.04;
  const MOVE_SPEED: number = 1;

  interface PlayerProps {
    startingMapPositionX: number;
    startingMapPositionY: number;
    startingAngle: number;
  }

  class Player {
    readonly startingMapPositionX: number;
    readonly startingMapPositionY: number;
    readonly startingAngle: number;
    currentFieldPositionX: number;
    currentFieldPositionY: number;
    angle: number;

    constructor(props: PlayerProps) {
      this.startingMapPositionX = props.startingMapPositionX;
      this.startingMapPositionY = props.startingMapPositionY;
      this.startingAngle = props.startingAngle;
      this.currentFieldPositionX = props.startingMapPositionX * BLOCK_SIZE - BLOCK_SIZE;
      this.currentFieldPositionY = props.startingMapPositionY * BLOCK_SIZE - BLOCK_SIZE;
      this.angle = ((props.startingAngle - 90) * Math.PI) / 180;
    }
  }

  const player: Player = new Player({
    startingMapPositionX: 1,
    startingMapPositionY: 1,
    startingAngle: 180,
  });

  p.setup = () => {
    p.createCanvas(1200, 1200);
  };

  const getCanvasPositionFromFieldPosition = (x: number, y: number): number[] => {
    const canvasX = x + BLOCK_SIZE * 2 - BLOCK_SIZE / 2;
    const canvasY = y + BLOCK_SIZE * 2 - BLOCK_SIZE / 2;
    return [canvasX, canvasY];
  };

  const isFieldPositionWithinWall = (x: number, y: number): boolean => {
    const blockX = Math.ceil(x / BLOCK_SIZE + 0.5);
    const blockY = Math.ceil(y / BLOCK_SIZE + 0.5);
    if (blockY < 0 || blockY >= MAP.length || blockX < 0 || blockX >= MAP[0].length) {
      return true;
    }
    return MAP[blockY][blockX] === W;
  };

  const angleIncrementPerRay: number = ((FOV / HORIZONTAL_RESOLUTION) * Math.PI) / 180;
  const halfFovRad: number = ((FOV / 2) * Math.PI) / 180;

  const tryMove = (dir: number) => {
    const newX =
      player.currentFieldPositionX + Math.cos(player.angle) * MOVE_SPEED * dir;
    const newY =
      player.currentFieldPositionY + Math.sin(player.angle) * MOVE_SPEED * dir;
    if (!isFieldPositionWithinWall(newX, newY)) {
      player.currentFieldPositionX = newX;
      player.currentFieldPositionY = newY;
    }
  };

  const getRayLength = (cosAngle: number, sinAngle: number): number => {
    let rayLength: number = 0;
    while (
      !isFieldPositionWithinWall(
        player.currentFieldPositionX + cosAngle * rayLength,
        player.currentFieldPositionY + sinAngle * rayLength,
      )
    ) {
      rayLength += 4;
    }
    return rayLength;
  };

  p.draw = () => {
    p.background(18);

    for (let i = 0; i < MAP.length; i++) {
      for (let j = 0; j < MAP[i].length; j++) {
        if (MAP[i][j] === W) {
          p.rect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }

    const playerCanvasPostion = getCanvasPositionFromFieldPosition(
      player.currentFieldPositionX,
      player.currentFieldPositionY,
    );

    p.push();
    p.translate(playerCanvasPostion[0], playerCanvasPostion[1]);
    p.rotate(player.angle);
    p.triangle(8, 0, -4, -5, -4, 5);
    p.pop();

    if (p.keyIsDown(p.LEFT_ARROW) || p.keyIsDown(65)) {
      player.angle -= ROTATION_SPEED;
    }
    if (p.keyIsDown(p.RIGHT_ARROW) || p.keyIsDown(68)) {
      player.angle += ROTATION_SPEED;
    }

    if (p.keyIsDown(p.UP_ARROW) || p.keyIsDown(87)) tryMove(1);
    if (p.keyIsDown(p.DOWN_ARROW) || p.keyIsDown(83)) tryMove(-1);

    const rayEndpoints: number[][] = [];

    for (let i = 0; i < HORIZONTAL_RESOLUTION; i++) {
      const angle: number = player.angle - halfFovRad + i * angleIncrementPerRay;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const rayLength: number = getRayLength(cosAngle, sinAngle);
      rayEndpoints.push(
        getCanvasPositionFromFieldPosition(
          player.currentFieldPositionX + cosAngle * rayLength,
          player.currentFieldPositionY + sinAngle * rayLength,
        ),
      );
    }

    p.push();
    p.stroke(255, 255, 0);
    p.strokeWeight(1);
    for (const [x, y] of rayEndpoints) {
      p.line(playerCanvasPostion[0], playerCanvasPostion[1], x, y);
    }
    p.pop();
  };
}
