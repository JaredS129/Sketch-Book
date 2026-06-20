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

  const DIRECTIONS = [
    { key: p.UP_ARROW, dx: 0, dy: -1 },
    { key: p.DOWN_ARROW, dx: 0, dy: 1 },
    { key: p.LEFT_ARROW, dx: -1, dy: 0 },
    { key: p.RIGHT_ARROW, dx: 1, dy: 0 },
    // WASD
    { key: 87, dx: 0, dy: -1 },
    { key: 83, dx: 0, dy: 1 },
    { key: 65, dx: -1, dy: 0 },
    { key: 68, dx: 1, dy: 0 },
  ];

  const BLOCK_SIZE: number = 100;
  const HORIZONTAL_RESOLUTION: number = 320;

  interface PlayerProps {
    startingX: number;
    startingY: number;
  }

  class Player {
    readonly startingX: number;
    readonly startingY: number;
    posX: number;
    posY: number;

    constructor(props: PlayerProps) {
      this.startingX = props.startingX;
      this.startingY = props.startingY;
      this.posX = props.startingX;
      this.posY = props.startingY;
    }
  }

  const player: Player = new Player({
    startingX: 1,
    startingY: 1,
  });

  p.setup = () => {
    p.createCanvas(1200, 1200);
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

    const PLAYER_ABS_POS_X = player.posX + BLOCK_SIZE * 2 - BLOCK_SIZE / 2;
    const PLAYER_ABS_POS_Y = player.posY + BLOCK_SIZE * 2 - BLOCK_SIZE / 2;

    p.triangle(
      PLAYER_ABS_POS_X,
      PLAYER_ABS_POS_Y,
      PLAYER_ABS_POS_X + 5,
      PLAYER_ABS_POS_Y - 5,
      PLAYER_ABS_POS_X - 5,
      PLAYER_ABS_POS_Y - 5,
    );

    const checkIfWithinWallBlock = (x: number, y: number): boolean => {
      const blockX = Math.ceil(x / BLOCK_SIZE + 0.5);
      const blockY = Math.ceil(y / BLOCK_SIZE + 0.5);
      return MAP[blockY][blockX] === W;
    };

    for (const { key, dx, dy } of DIRECTIONS) {
      if (p.keyIsDown(key)) {
        const newX = player.posX + dx;
        const newY = player.posY + dy;

        const newPosIsWithinWallBlock: boolean = checkIfWithinWallBlock(newX, newY);

        if (newPosIsWithinWallBlock) {
          continue;
        }

        player.posX = newX;
        player.posY = newY;
        break;
      }
    }

    // if (
    //   !p.keyIsDown(p.UP_ARROW) &&
    //   !p.keyIsDown(p.DOWN_ARROW) &&
    //   !p.keyIsDown(p.LEFT_ARROW) &&
    //   !p.keyIsDown(p.RIGHT_ARROW) &&
    //   !p.keyIsDown(87) &&
    //   !p.keyIsDown(83) &&
    //   !p.keyIsDown(65) &&
    //   !p.keyIsDown(68)
    // ) {
    //   hasMoved = false;
    // }
  };
}
