import { StepLocationRelativeToParent } from '@activepieces/shared';
import {
  ARC_LENGTH,
  BIG_BUTTON_SIZE,
  BUTTON_SIZE,
  ButtonType,
  EXTRA_VERTICAL_SPACE_FOR_LINE_WITH_LABEL,
  FLOW_ITEM_HEIGHT,
  PositionButton,
  VERTICAL_SPACE_BETWEEN_LABEL_AND_BUTTON,
  VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
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

  arrow(forLoopReturningLine = false): SvgDrawer {
    if (!forLoopReturningLine) {
      return new SvgDrawer([
        ...this.operations,
        {
          type: 'arrow',
          content: 'm6 -6 l-6 6 m-6 -6 l6 6',
        },
      ]);
    }
    return new SvgDrawer([
      ...this.operations,
      {
        type: 'arrow',
        content: ' m0 -6 l6 6  m-6 0 m6 0 l-6 6 m3.7 -6',
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

function extractDyDx(
  start: Position,
  end: Position
): { dx: number; dy: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return { dx, dy };
}

export function drawVerticalLineToNextStep(
  from: Position,
  to: Position,
  drawArrow: boolean
): SvgDrawer {
  const { dy } = extractDyDx(from, to);
  const svgDrawer = SvgDrawer.empty().move(from.x, from.y);
  if (from.x === to.x) {
    const verticalLine = svgDrawer.drawVerticalLine(dy);
    return drawArrow ? verticalLine.arrow() : verticalLine;
  }
  throw Error('to.x: ${to.x} and from.x ${from.x} aren not the same');
}
/**depending of dy,dx signs we draw the arcs, so this function could be used right after parent step, or when closing its graph */
export function drawLineComponentForStepWithChildren({
  from,
  to,
  drawArrow,
  lineHasLabel,
}: {
  from: Position;
  to: Position;
  drawArrow: boolean;
  lineHasLabel: boolean;
}): SvgDrawer {
  const { dx, dy } = extractDyDx(from, to);
  if (dy < 0) {
    throw new Error('dy should be positive');
  }
  const svgDrawer = SvgDrawer.empty()
    .move(from.x, from.y)
    .drawVerticalLine(dy - VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS - ARC_LENGTH)
    .drawArc(dx > 0, !(dx > 0))
    .drawHorizontalLine(dx + (dx < 0 ? 1 : -1) * 2 * ARC_LENGTH)
    .drawArc(dx > 0, dx > 0)
    .drawVerticalLine(
      VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS -
        ARC_LENGTH +
        (lineHasLabel ? EXTRA_VERTICAL_SPACE_FOR_LINE_WITH_LABEL : 0)
    );
  return drawArrow ? svgDrawer.arrow() : svgDrawer;
}

export function drawLineComponentWithButton({
  from,
  to,
  stepName,
  stepLocationRelativeToParent,
  btnType,
  drawArrow,
  lineHasLabel,
}: {
  from: Position;
  to: Position;
  stepName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
  btnType: ButtonType;
  drawArrow: boolean;
  lineHasLabel: boolean;
}): {
  line: SvgDrawer;
  button: PositionButton;
} {
  switch (btnType) {
    case 'small': {
      const btnY =
        to.y -
        VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS / 2.0 -
        BUTTON_SIZE / 2.0 +
        (lineHasLabel ? VERTICAL_SPACE_BETWEEN_LABEL_AND_BUTTON : 0);
      return {
        line:
          from.x === to.x
            ? drawVerticalLineToNextStep(from, to, drawArrow)
            : drawLineComponentForStepWithChildren({
                from,
                to,
                drawArrow,
                lineHasLabel,
              }),
        button: {
          x: to.x - BUTTON_SIZE / 2.0,
          y: btnY,
          type: 'small',
          stepName,
          stepLocationRelativeToParent,
        },
      };
    }
    case 'big': {
      return {
        line: drawLineComponentForStepWithChildren({
          from,
          to,
          drawArrow,
          lineHasLabel: false,
        }),
        button: {
          x: to.x - BIG_BUTTON_SIZE / 2.0,
          y:
            to.y +
            (lineHasLabel ? EXTRA_VERTICAL_SPACE_FOR_LINE_WITH_LABEL / 2 : 0) +
            FLOW_ITEM_HEIGHT / 2 -
            BIG_BUTTON_SIZE / 2,
          type: 'big',
          stepName,
          stepLocationRelativeToParent,
        },
      };
    }
  }
}
