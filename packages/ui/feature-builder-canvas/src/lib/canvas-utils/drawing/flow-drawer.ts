import {
  Action,
  ActionType,
  BranchAction,
  LoopOnItemsAction,
  StepLocationRelativeToParent,
  isNil,
} from '@activepieces/shared';
import { Trigger } from '@activepieces/shared';
import {
  SPACE_BETWEEN_VERTICAL_STEP,
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
  SPACE_BETWEEN_TWO_BRANCH,
  PositionButton,
  SPACE_BETWEEN_VERTICAL_LONG_STEP,
  SPACE_ON_EMPTY_LOOP_SIDE_HORZINTAL,
  SPACE_BETWEEN_VERTICAL_ARROW_LINE_HEIGHT,
} from './draw-common';
import { SvgDrawer, drawLine, drawLineWithButton } from './svg-drawer';
import { Position, PositionedStep } from './step-card';

export const ARC_LENGTH = 15;

export class FlowDrawer {
  readonly steps: readonly PositionedStep[];
  readonly svg: SvgDrawer;
  readonly buttons: readonly PositionButton[];

  constructor({
    svg = SvgDrawer.empty(),
    steps = [],
    buttons = [],
  }: {
    svg: SvgDrawer;
    steps: readonly PositionedStep[];
    buttons: readonly PositionButton[];
  }) {
    this.svg = svg;
    this.steps = steps;
    this.buttons = buttons;
  }

  appendSvg(svg: SvgDrawer): FlowDrawer {
    return new FlowDrawer({
      buttons: [...this.buttons],
      svg: this.svg.merge(svg),
      steps: [...this.steps],
    });
  }

  appendButton(button: PositionButton): FlowDrawer {
    return new FlowDrawer({
      buttons: [...this.buttons, button],
      svg: this.svg,
      steps: [...this.steps],
    });
  }

  mergeChild(child: FlowDrawer): FlowDrawer {
    return new FlowDrawer({
      buttons: [...this.buttons, ...child.buttons],
      svg: this.svg.merge(child.svg),
      steps: [...this.steps, ...child.steps],
    });
  }

  boundingBox(): { width: number; height: number } {
    if (this.steps.length === 0) {
      return {
        width: 0,
        height: 0,
      };
    }
    const minX = this.steps.reduce(
      (min, positionedStep) => Math.min(min, positionedStep.x),
      this.steps[0].x
    );
    const minY = this.steps.reduce(
      (min, positionedStep) => Math.min(min, positionedStep.y),
      this.steps[0].y
    );
    const maxX = this.steps.reduce(
      (max, positionedStep) =>
        Math.max(max, positionedStep.x + FLOW_ITEM_WIDTH),
      this.steps[0].x + FLOW_ITEM_WIDTH
    );
    const maxY = this.steps.reduce(
      (max, positionedStep) =>
        Math.max(max, positionedStep.y + FLOW_ITEM_HEIGHT),
      this.steps[0].y + FLOW_ITEM_HEIGHT
    );
    return {
      width:
        Math.max(maxX, this.svg.maximumX()) -
        Math.min(minX, this.svg.minimumX()),
      height:
        Math.max(maxY, this.svg.maximumY()) -
        Math.min(minY, this.svg.minimumY()),
    };
  }

  offset(x: number, y: number): FlowDrawer {
    return new FlowDrawer({
      buttons: this.buttons.map((button) => ({
        ...button,
        x: button.x + x,
        y: button.y + y,
      })),
      svg: this.svg.offset(x, y),
      steps: this.steps.map(
        (step) =>
          new PositionedStep({
            ...step,
            x: step.x + x,
            y: step.y + y,
          })
      ),
    });
  }

  static construct(step: Action | Trigger | undefined): FlowDrawer {
    if (isNil(step)) {
      return new FlowDrawer({
        buttons: [],
        svg: SvgDrawer.empty(),
        steps: [
          new PositionedStep({
            x: 0,
            y: 0,
            content: null,
          }),
        ],
      });
    }
    const currentPostionedStep = new PositionedStep({
      x: 0,
      y: 0,
      content: step,
    });
    let flowDrawer = new FlowDrawer({
      buttons: [],
      svg: SvgDrawer.empty(),
      steps: [currentPostionedStep],
    });
    const centerBottom = currentPostionedStep.center('bottom');
    let childHeight = 0;
    switch (step.type) {
      case ActionType.LOOP_ON_ITEMS: {
        const loopDrawer = handleLoopAction(step, centerBottom);
        childHeight = loopDrawer.boundingBox().height;
        flowDrawer = flowDrawer.mergeChild(loopDrawer);
        break;
      }
      case ActionType.BRANCH: {
        const branchDrawer = handleBranchAction(step, centerBottom);
        childHeight = branchDrawer.boundingBox().height;
        flowDrawer = flowDrawer.mergeChild(branchDrawer);
        break;
      }

      default: {
        const { line, button } = drawLineWithButton({
          from: centerBottom,
          to: {
            x: centerBottom.x,
            y: centerBottom.y + SPACE_BETWEEN_VERTICAL_STEP,
          },
          stepName: step.name,
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        });
        childHeight = SPACE_BETWEEN_VERTICAL_STEP;
        flowDrawer = flowDrawer.appendButton(button).appendSvg(line);
        break;
      }
    }

    if (step.nextAction) {
      const nextFlowDrawer = FlowDrawer.construct(step.nextAction).offset(
        0,
        FLOW_ITEM_HEIGHT + childHeight
      );
      flowDrawer = flowDrawer.mergeChild(nextFlowDrawer);
    }
    return flowDrawer;
  }
}

function handleLoopAction(
  step: LoopOnItemsAction,
  centerBottom: Position
): FlowDrawer {
  const firstLoopDrawer = FlowDrawer.construct(step.firstLoopAction);
  const sideLength =
    firstLoopDrawer.boundingBox().width / 4.0 +
    SPACE_ON_EMPTY_LOOP_SIDE_HORZINTAL / 2.0;

  const firstLoopOffset = {
    x: sideLength,
    y: FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_LONG_STEP,
  };
  const firstLoopDrawerDrawerWithOffset = firstLoopDrawer.offset(
    firstLoopOffset.x,
    firstLoopOffset.y
  );
  const firstLoopDrawerTopCenter =
    firstLoopDrawerDrawerWithOffset.steps[0].center('top');

  const { line, button } = drawLineWithButton({
    from: centerBottom,
    to: firstLoopDrawerTopCenter,
    stepName: step.name,
    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
  });

  const firstLoopStepClosingLine = SvgDrawer.empty()
    .move(
      firstLoopDrawerTopCenter.x,
      firstLoopDrawerTopCenter.y +
        firstLoopDrawerDrawerWithOffset.boundingBox().height
    )
    .drawVerticalLine(SPACE_BETWEEN_VERTICAL_LONG_STEP / 2.0 - ARC_LENGTH)
    .drawArc(false, true)
    .drawHorizontalLine(-sideLength + 2 * ARC_LENGTH)
    .drawArc(false, false)
    .drawVerticalLine(SPACE_BETWEEN_VERTICAL_LONG_STEP / 2.0 - ARC_LENGTH);

  const emptyLoopLine = SvgDrawer.empty()
    .move(centerBottom.x, centerBottom.y)
    .drawVerticalLine(
      SPACE_BETWEEN_VERTICAL_LONG_STEP -
        ARC_LENGTH -
        SPACE_BETWEEN_VERTICAL_ARROW_LINE_HEIGHT
    )
    .drawArc(false, true)
    .drawHorizontalLine(-(firstLoopOffset.x - 2 * ARC_LENGTH))
    .drawArc(false, false)
    .drawVerticalLine(
      SPACE_BETWEEN_VERTICAL_ARROW_LINE_HEIGHT -
        2 * ARC_LENGTH +
        firstLoopDrawer.boundingBox().height +
        SPACE_BETWEEN_VERTICAL_LONG_STEP / 2.0
    )
    .drawArc(true, false)
    .drawHorizontalLine(sideLength - 2 * ARC_LENGTH)
    .drawArc(true, true)
    .drawVerticalLine(SPACE_BETWEEN_VERTICAL_LONG_STEP / 2.0 - ARC_LENGTH);

  return firstLoopDrawerDrawerWithOffset
    .appendSvg(line)
    .appendButton(button)
    .appendSvg(emptyLoopLine)
    .appendSvg(firstLoopStepClosingLine);
}
function handleBranchAction(
  step: BranchAction,
  centerBottom: Position
): FlowDrawer {
  let resultDrawer = new FlowDrawer({
    buttons: [],
    svg: SvgDrawer.empty(),
    steps: [],
  });
  const actions = [step.onSuccessAction, step.onFailureAction];
  const sides: FlowDrawer[] = actions.map((action) =>
    FlowDrawer.construct(action)
  );
  const { maximumHeight, xOffset } = calculateDimensionsForBranch(sides);

  let leftStartingPoint = xOffset;
  console.log(xOffset);
  sides.forEach((side, index) => {
    const stepPosition = {
      x:
        leftStartingPoint +
        (side.boundingBox().width - FLOW_ITEM_WIDTH) / 2.0 +
        FLOW_ITEM_WIDTH / 2.0,
      y: FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_LONG_STEP,
    };
    const sideDrawer = side.offset(stepPosition.x, stepPosition.y);

    const { line, button } = drawLineWithButton({
      from: centerBottom,
      to: {
        x: stepPosition.x + FLOW_ITEM_WIDTH / 2.0,
        y: stepPosition.y,
      },
      stepName: step.name,
      stepLocationRelativeToParent:
        index == 0
          ? StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
          : StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
    });
    const secondLine = drawLine(
      {
        x: sideDrawer.steps[0].center('bottom').x,
        y: sideDrawer.steps[0].y + sideDrawer.boundingBox().height,
      },
      {
        x: centerBottom.x,
        y:
          centerBottom.y +
          SPACE_BETWEEN_VERTICAL_LONG_STEP +
          maximumHeight +
          SPACE_BETWEEN_VERTICAL_LONG_STEP,
      }
    );
    resultDrawer = resultDrawer
      .mergeChild(sideDrawer)
      .appendSvg(line)
      .appendSvg(secondLine)
      .appendButton(button);

    leftStartingPoint += SPACE_BETWEEN_TWO_BRANCH + side.boundingBox().width;
  });
  return resultDrawer;
}

function calculateDimensionsForBranch(sides: FlowDrawer[]): {
  maximumHeight: number;
  xOffset: number;
} {
  const maximumHeight: number = sides.reduce(
    (max: number, side: FlowDrawer) => Math.max(max, side.boundingBox().height),
    0
  );
  const summationWidth: number = sides.reduce(
    (sum: number, side: FlowDrawer) => sum + side.boundingBox().width,
    0
  );
  const staticOffset =
    summationWidth + SPACE_BETWEEN_TWO_BRANCH * (sides.length - 1);
  return {
    maximumHeight,
    xOffset: -(staticOffset / 2.0),
  };
}
