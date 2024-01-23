import {
  LoopOnItemsAction,
  StepLocationRelativeToParent,
  flowHelper,
} from '@activepieces/shared';
import {
  ARC_LENGTH,
  BUTTON_SIZE,
  FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING,
  HORIZONTAL_SPACE_BETWEEN_RETURNING_LOOP_ARROW_AND_STARTING_LOOP_ARC,
  HORIZONTAL_SPACE_FOR_EMPTY_SIDE_OF_LOOP,
  PositionButton,
  VERTICAL_SPACE_BETWEEN_AFTERLOOP_LINE_AND_LOOP_BOTTOM,
  VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
  VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
} from './draw-common';
import { FlowDrawer } from './flow-drawer';
import { SvgDrawer, drawLineComponentWithButton } from './svg-drawer';
import { Position } from './step-card';

export class LoopDrawer {
  private constructor() {
    throw new Error('LoopDrawer is not meant to be instantiated');
  }
  static handleLoopAction(step: LoopOnItemsAction) {
    const firstChildActionDrawer = FlowDrawer.construct(step.firstLoopAction);
    const xPositionOfFirstChildAction =
      firstChildActionDrawer.boundingBox().width / 2.0;

    const firstChildActionOffset = {
      x: xPositionOfFirstChildAction,
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
    const startingLineComponent = drawLineComponentWithButton({
      from: FlowDrawer.centerBottomOfFlowItemUi,
      to: firstChildActionTopCenter,
      stepName: step.name,
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
      btnType: step.firstLoopAction ? 'small' : 'big',
      drawArrow: !!step.firstLoopAction,
      lineHasLabel: false,
    });

    const firstLoopStepClosingLine =
      LoopDrawer.drawFirstChildActionClosingLineComponent({
        firstChildActionTopCenter,
        firstLoopDrawerDrawerWithOffset,
        xPositionOfFirstChildActionOffset: xPositionOfFirstChildAction,
      });

    const emptyLoopLine = LoopDrawer.drawEmptySideOfLoopComponent({
      firstChildActionDrawer,
    });

    const verticalLineConnectingLoopStepWithWhatComesAfter = SvgDrawer.empty()
      .move(
        firstChildActionTopCenter.x - xPositionOfFirstChildAction,
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
      .appendSvg(startingLineComponent.line)
      .appendButton(startingLineComponent.button)
      .appendSvg(emptyLoopLine)
      .appendSvg(firstLoopStepClosingLine)
      .appendButton(afterLoopButton)
      .appendSvg(
        isLastChildStep
          ? verticalLineConnectingLoopStepWithWhatComesAfter
          : verticalLineConnectingLoopStepWithWhatComesAfter.arrow()
      );
  }

  static drawFirstChildActionClosingLineComponent({
    firstChildActionTopCenter,
    firstLoopDrawerDrawerWithOffset,
    xPositionOfFirstChildActionOffset,
  }: {
    firstChildActionTopCenter: Position;
    firstLoopDrawerDrawerWithOffset: FlowDrawer;
    xPositionOfFirstChildActionOffset: number;
  }) {
    return SvgDrawer.empty()
      .move(
        firstChildActionTopCenter.x,
        firstChildActionTopCenter.y +
          firstLoopDrawerDrawerWithOffset.boundingBox().height
      )
      .drawVerticalLine(
        VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD / 2.0 - ARC_LENGTH
      )
      .drawArc(false, true)
      .drawHorizontalLine(-xPositionOfFirstChildActionOffset - ARC_LENGTH);
  }
  static drawEmptySideOfLoopComponent({
    firstChildActionDrawer,
  }: {
    firstChildActionDrawer: FlowDrawer;
  }) {
    return SvgDrawer.empty()
      .move(
        FlowDrawer.centerBottomOfFlowItemUi.x -
          HORIZONTAL_SPACE_BETWEEN_RETURNING_LOOP_ARROW_AND_STARTING_LOOP_ARC,
        FlowDrawer.centerBottomOfFlowItemUi.y +
          (VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD -
            VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS)
      )
      .arrow(true)
      .drawHorizontalLine(-HORIZONTAL_SPACE_FOR_EMPTY_SIDE_OF_LOOP)
      .drawArc(false, false)
      .drawVerticalLine(
        VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS -
          2 * ARC_LENGTH +
          firstChildActionDrawer.boundingBox().height +
          VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD / 2.0
      )
      .drawArc(true, false)
      .drawHorizontalLine(HORIZONTAL_SPACE_FOR_EMPTY_SIDE_OF_LOOP);
  }
}
