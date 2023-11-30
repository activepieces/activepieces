import { StepLocationRelativeToParent } from '@activepieces/shared';
import {
  ARC_LENGTH,
  BUTTON_SIZE,
  PositionButton,
  SPACE_BETWEEN_BUTTON_AND_ARROW,
  SPACE_BETWEEN_VERTICAL_ARROW_LINE_HEIGHT,
} from './draw-common';
import { Position } from './step-card';

type SvgOperation =
  | {
      type: 'M';
      x: number;
      y: number;
    }
  | {
      type: 'h' | 'v';
      delta: number;
    }
  | {
      type: 'arrow';
      content: string;
    }
  | {
      type: 'arc';
      isRight: boolean;
      content: string;
    };

export class SvgDrawer {
  private readonly operations: SvgOperation[] = [];

  constructor(operations: SvgOperation[]) {
    this.operations = operations;
  }

  static empty(): SvgDrawer {
    return new SvgDrawer([]);
  }

  private positions(): Position[] {
    if (this.operations.length === 0) {
      return [];
    }
    let currentPositionX =
      this.operations[0].type === 'M' ? this.operations[0].x : 0;
    let currentPositionY =
      this.operations[0].type === 'M' ? this.operations[0].y : 0;
    const positions: Position[] = [];
    for (const operation of this.operations) {
      switch (operation.type) {
        case 'arc': {
          currentPositionX += operation.isRight ? ARC_LENGTH : -ARC_LENGTH;
          currentPositionY += ARC_LENGTH;
          break;
        }
        case 'M': {
          currentPositionX = operation.x;
          currentPositionY = operation.y;
          break;
        }
        case 'h': {
          currentPositionX += operation.delta;
          break;
        }
        case 'v': {
          currentPositionY += operation.delta;
          break;
        }
        case 'arrow': {
          break;
        }
      }
      positions.push({
        x: currentPositionX,
        y: currentPositionY,
      });
    }
    return positions;
  }

  maximumX(): number {
    return this.positions().reduce(
      (max, position) => Math.max(max, position.x),
      Number.MIN_SAFE_INTEGER
    );
  }

  minimumX(): number {
    return this.positions().reduce(
      (min, position) => Math.min(min, position.x),
      Number.MAX_SAFE_INTEGER
    );
  }

  maximumY(): number {
    return this.positions().reduce(
      (max, position) => Math.max(max, position.y),
      Number.MIN_SAFE_INTEGER
    );
  }

  minimumY(): number {
    return this.positions().reduce(
      (min, position) => Math.min(min, position.y),
      Number.MAX_SAFE_INTEGER
    );
  }

  merge(child: SvgDrawer): SvgDrawer {
    return new SvgDrawer([...this.operations, ...child.operations]);
  }

  offset(dx: number, dy: number): SvgDrawer {
    return new SvgDrawer(
      [...this.operations].map((value) => {
        if (value.type === 'M') {
          return {
            ...value,
            x: value.x + dx,
            y: value.y + dy,
          };
        }
        return value;
      })
    );
  }

  drawVerticalLine(dy: number): SvgDrawer {
    return new SvgDrawer([
      ...this.operations,
      {
        type: 'v',
        delta: dy,
      },
    ]);
  }

  drawHorizontalLine(dx: number): SvgDrawer {
    return new SvgDrawer([
      ...this.operations,
      {
        type: 'h',
        delta: dx,
      },
    ]);
  }

  move(dx: number, dy: number): SvgDrawer {
    return new SvgDrawer([
      ...this.operations,
      {
        type: 'M',
        x: dx,
        y: dy,
      },
    ]);
  }

  drawArc(isRight: boolean, sweep: boolean): SvgDrawer {
    const xSign = isRight ? '' : '-';
    const ySign = '';
    const shouldSweep = sweep ? 1 : 0;
    return new SvgDrawer([
      ...this.operations,
      {
        type: 'arc',
        isRight,
        content: `a ${ARC_LENGTH} ${ARC_LENGTH} 0 0 ${shouldSweep} ${xSign}${ARC_LENGTH} ${ySign}${ARC_LENGTH}`,
      },
    ]);
  }

  arrow(): SvgDrawer {
    return new SvgDrawer([
      ...this.operations,
      {
        type: 'arrow',
        content: 'm6 -6 l-6 6 m-6 -6 l6 6',
      },
    ]);
  }

  // Get the current SVG string
  toSvg(): { content: string } {
    return {
      content: this.operations
        .map((operation) => {
          switch (operation.type) {
            case 'M':
              return `${operation.type} ${operation.x} ${operation.y}`;
            case 'h':
              return `${operation.type} ${operation.delta}`;
            case 'v':
              return `${operation.type} ${operation.delta}`;
            case 'arrow':
              return `${operation.content}`;
            case 'arc':
              return `${operation.content}`;
          }
        })
        .join(' '),
    };
  }
}

export function drawLine(from: Position, to: Position): SvgDrawer {
  const { x: startX, y: startY } = from;
  const { x: endX, y: endY } = to;
  const dx = endX - startX;
  const dy = endY - startY;
  if (dy < 0) {
    throw new Error('dy should be positive');
  }
  const svgDrawer = SvgDrawer.empty().move(startX, startY);
  if (startX === endX) {
    return svgDrawer.drawVerticalLine(dy).arrow();
  }

  return svgDrawer
    .drawVerticalLine(
      dy - SPACE_BETWEEN_VERTICAL_ARROW_LINE_HEIGHT - ARC_LENGTH
    )
    .drawArc(dx > 0, !(dx > 0))
    .drawHorizontalLine(dx + (dx < 0 ? 1 : -1) * 2 * ARC_LENGTH)
    .drawArc(dx > 0, dx > 0)
    .drawVerticalLine(SPACE_BETWEEN_VERTICAL_ARROW_LINE_HEIGHT - ARC_LENGTH)
    .arrow();
}

export function drawLineWithButton({
  from,
  to,
  stepName,
  stepLocationRelativeToParent,
}: {
  from: Position;
  to: Position;
  stepName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
}): {
  line: SvgDrawer;
  button: PositionButton;
} {
  return {
    line: drawLine(from, to),
    button: {
      x: to.x - BUTTON_SIZE / 2.0,
      y: to.y - SPACE_BETWEEN_BUTTON_AND_ARROW - BUTTON_SIZE / 2.0,
      type: 'small',
      stepName,
      stepLocationRelativeToParent,
    },
  };
}
