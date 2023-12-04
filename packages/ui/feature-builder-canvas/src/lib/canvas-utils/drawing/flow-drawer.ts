import {
  Action,
  ActionType,
  LoopOnItemsAction,
  StepLocationRelativeToParent,
  flowHelper,
  isNil,
} from '@activepieces/shared';
import { Trigger } from '@activepieces/shared';
import {
  VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
  FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING,
  FLOW_ITEM_WIDTH,
  PositionButton,
  VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
  HORIZONTAL_SPACE_FOR_EMPTY_SIDE_OF_LOOP,
  HORIZONTAL_SPACE_BETWEEN_RETURNING_LOOP_ARROW_AND_STARTING_LOOP_ARC,
  VERTICAL_SPACE_BETWEEN_AFTERLOOP_LINE_AND_LOOP_BOTTOM,
  BUTTON_SIZE,
} from './draw-common';
import { SvgDrawer, drawLineComponentWithButton } from './svg-drawer';
import { Position, PositionedStep } from './step-card';
import { BranchDrawer } from './branch-drawer';

export const ARC_LENGTH = 15;

export class FlowDrawer {
  readonly steps: readonly PositionedStep[];
  readonly svg: SvgDrawer;
  readonly buttons: readonly PositionButton[];
  static trigger: Trigger;
  static centerBottom = new PositionedStep({
    x: 0,
    y: 0,
    content: null,
  }).center('bottom');
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
        Math.max(max, positionedStep.y + FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING),
      this.steps[0].y + FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING
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
    const centerBottomOfCurrentStep = currentPostionedStep.center('bottom');
    let childHeight = 0;
    switch (step.type) {
      case ActionType.LOOP_ON_ITEMS: {
        const loopDrawer = handleLoopAction(step, centerBottomOfCurrentStep);
        childHeight = loopDrawer.boundingBox().height;
        flowDrawer = flowDrawer.mergeChild(loopDrawer);
        break;
      }
      case ActionType.BRANCH: {
        const branchDrawer = BranchDrawer.handleBranchAction(step);
        childHeight = branchDrawer.boundingBox().height;
        flowDrawer = flowDrawer.mergeChild(branchDrawer);
        break;
      }

      default: {
        const { line, button } = drawLineComponentWithButton({
          from: centerBottomOfCurrentStep,
          to: {
            x: centerBottomOfCurrentStep.x,
            y:
              centerBottomOfCurrentStep.y +
              VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
          },
          stepName: step.name,
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
          btnType: 'small',
          isLastChildStep: flowHelper.isStepLastChildOfParent(
            step,
            FlowDrawer.trigger
          ),
        });
        childHeight = VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS;
        flowDrawer = flowDrawer.appendButton(button).appendSvg(line);
        break;
      }
    }

    if (step.nextAction) {
      const nextFlowDrawer = FlowDrawer.construct(step.nextAction).offset(
        0,
        FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING + childHeight
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
  const firstChildActionDrawer = FlowDrawer.construct(step.firstLoopAction);
  const sideLength =
    firstChildActionDrawer.boundingBox().width / 4.0 +
    HORIZONTAL_SPACE_FOR_EMPTY_SIDE_OF_LOOP / 2.0;

  const firstChildActionOffset = {
    x: sideLength,
    y:
      FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING +
      VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
  };
  const firstLoopDrawerDrawerWithOffset = firstChildActionDrawer.offset(
    firstChildActionOffset.x,
    firstChildActionOffset.y
  );
  const firstChildActionTopCenter =
    firstLoopDrawerDrawerWithOffset.steps[0].center('top');
  const isLastChildStep = flowHelper.isStepLastChildOfParent(
    step,
    FlowDrawer.trigger
  );
  const { line, button } = drawLineComponentWithButton({
    from: centerBottom,
    to: firstChildActionTopCenter,
    stepName: step.name,
    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
    btnType: step.firstLoopAction ? 'small' : 'big',
    isLastChildStep,
  });

  const firstLoopStepClosingLine = SvgDrawer.empty()
    .move(
      firstChildActionTopCenter.x,
      firstChildActionTopCenter.y +
        firstLoopDrawerDrawerWithOffset.boundingBox().height
    )
    .drawVerticalLine(VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD / 2.0 - ARC_LENGTH)
    .drawArc(false, true)
    .drawHorizontalLine(-sideLength);

  const emptyLoopLine = SvgDrawer.empty()
    .move(
      centerBottom.x -
        HORIZONTAL_SPACE_BETWEEN_RETURNING_LOOP_ARROW_AND_STARTING_LOOP_ARC,
      centerBottom.y +
        (VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD -
          VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS)
    )
    .arrow(true)
    .drawHorizontalLine(-(firstChildActionOffset.x - 2 * ARC_LENGTH))
    .drawArc(false, false)
    .drawVerticalLine(
      VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS -
        2 * ARC_LENGTH +
        firstChildActionDrawer.boundingBox().height +
        VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD / 2.0
    )
    .drawArc(true, false)
    .drawHorizontalLine(sideLength);

  const verticalLineConnectingLoopStepWithWhatComesAfter = SvgDrawer.empty()
    .move(
      firstChildActionTopCenter.x - sideLength,
      firstChildActionTopCenter.y +
        firstLoopDrawerDrawerWithOffset.boundingBox().height +
        VERTICAL_SPACE_BETWEEN_AFTERLOOP_LINE_AND_LOOP_BOTTOM
    )
    .drawVerticalLine(VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS);
  const afterLoopButton: PositionButton = {
    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
    stepName: step.name,
    type: 'small',
    x:
      verticalLineConnectingLoopStepWithWhatComesAfter.minimumX() -
      BUTTON_SIZE / 2.0,
    y:
      verticalLineConnectingLoopStepWithWhatComesAfter.maximumY() -
      VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS / 2 -
      BUTTON_SIZE / 2.0,
  };
  return firstLoopDrawerDrawerWithOffset
    .appendSvg(line)
    .appendButton(button)
    .appendSvg(emptyLoopLine)
    .appendSvg(firstLoopStepClosingLine)
    .appendButton(afterLoopButton)
    .appendSvg(
      isLastChildStep
        ? verticalLineConnectingLoopStepWithWhatComesAfter
        : verticalLineConnectingLoopStepWithWhatComesAfter.arrow()
    );
}
