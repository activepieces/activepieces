import {
  ActionType,
  BranchAction,
  PieceAction,
  StepLocationRelativeToParent,
  capitalizeFirstLetter,
  flowHelper,
} from '@activepieces/shared';
import { FlowDrawer } from './flow-drawer';
import {
  SvgDrawer,
  drawLineComponentForStepWithChildren,
  drawLineComponentWithButton,
} from './svg-drawer';
import {
  BUTTON_SIZE,
  EXTRA_VERTICAL_SPACE_FOR_LINE_WITH_LABEL,
  FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING,
  FLOW_ITEM_WIDTH,
  HORIZONTAL_SPACE_BETWEEN_BRANCHES,
  PositionButton,
  VERTICAL_SPACE_BETWEEN_LABEL_AND_FLOW_ITEM,
  VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
  VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
} from './draw-common';
import { Position } from './step-card';
import { ActionOutput } from '@activepieces/pieces-framework';

export class BranchDrawer {
  private constructor() {
    throw new Error('BranchDrawer is not meant to be instantiated');
  }

  static handleBranchAction(
    branchStep: BranchAction | PieceAction,
    outputs?: ActionOutput
  ): FlowDrawer {
    let resultDrawer = FlowDrawer.construct(undefined);
    const actions =
      branchStep.type === ActionType.BRANCH
        ? [branchStep.onSuccessAction, branchStep.onFailureAction]
        : Object.keys(outputs ?? {}).map(
            (output) => branchStep.children?.[output]
          );
    const branchesDrawers: FlowDrawer[] = actions.map((action) =>
      FlowDrawer.construct(action)
    );

    const { maximumHeight, xOfFartherestLeftChild } =
      BranchDrawer.calculateDimensionsForBranch(branchesDrawers);

    let leftStartingPoint = xOfFartherestLeftChild;
    branchesDrawers.forEach((bd, index) => {
      const firstChildStepPosition = {
        x: leftStartingPoint + Math.abs(bd.boundingBox().leftSide),
        y:
          FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING +
          VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
      };
      const drawerMovedToFirstChildStep = bd.offset(
        firstChildStepPosition.x,
        firstChildStepPosition.y + EXTRA_VERTICAL_SPACE_FOR_LINE_WITH_LABEL
      );
      const stepLocationRelativeToParent =
        index == 0
          ? StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
          : StepLocationRelativeToParent.INSIDE_FALSE_BRANCH;
      const lineComponentAtStartOfBranch =
        BranchDrawer.drawLineComponentAtStartOfBranch({
          firstChildStepPosition,
          branchStep,
          stepLocationRelativeToParent,
        });

      const afterBranchLineComponent =
        BranchDrawer.drawLineComponentAfterBranch({
          drawerMovedToFirstChildStep: drawerMovedToFirstChildStep.offset(
            0,
            -EXTRA_VERTICAL_SPACE_FOR_LINE_WITH_LABEL
          ),
          branchStep,
          maximumHeight,
        });
      resultDrawer = resultDrawer
        .mergeChild(drawerMovedToFirstChildStep)
        .appendLabel({
          x: drawerMovedToFirstChildStep.steps[0].center('bottom').x,
          y:
            drawerMovedToFirstChildStep.steps[0].y -
            VERTICAL_SPACE_BETWEEN_LABEL_AND_FLOW_ITEM,
          label: BranchDrawer.setLabel(index, branchStep),
        })
        .appendSvg(lineComponentAtStartOfBranch.line)
        .appendButton(lineComponentAtStartOfBranch.button)
        .appendSvg(afterBranchLineComponent);

      if (index === 1) {
        const afterBranchButton = BranchDrawer.createAfterBranchStepButton({
          afterBranchLineComponent,
          branchStep,
        });
        resultDrawer = resultDrawer.appendButton(afterBranchButton);
      }

      leftStartingPoint +=
        HORIZONTAL_SPACE_BETWEEN_BRANCHES + bd.boundingBox().width;
    });

    return resultDrawer;
  }

  private static calculateDimensionsForBranch(branches: FlowDrawer[]): {
    maximumHeight: number;
    xOfFartherestLeftChild: number;
  } {
    const maximumHeight: number = branches.reduce(
      (max: number, branch: FlowDrawer) =>
        Math.max(max, branch.boundingBox().height),
      0
    );
    const xOffset =
      HORIZONTAL_SPACE_BETWEEN_BRANCHES * (branches.length - 1) +
      Math.abs(branches[0].boundingBox().rightSide) +
      Math.abs(branches[1].boundingBox().leftSide);
    return {
      maximumHeight,
      xOfFartherestLeftChild:
        -(xOffset / 2.0) + branches[0].boundingBox().leftSide,
    };
  }

  private static doesBranchHaveChildren(
    branchStep: BranchAction | PieceAction,
    stepLocationRelativeToParent: StepLocationRelativeToParent
  ) {
    if (branchStep.type === ActionType.BRANCH) {
      return (
        (stepLocationRelativeToParent ===
          StepLocationRelativeToParent.INSIDE_TRUE_BRANCH &&
          !!branchStep.onSuccessAction) ||
        (stepLocationRelativeToParent ===
          StepLocationRelativeToParent.INSIDE_FALSE_BRANCH &&
          !!branchStep.onFailureAction)
      );
    }

    // TODO: need to test
    const allChildSteps = flowHelper.getAllChildSteps(branchStep);
    return allChildSteps.length > 1 ? true : false;
  }

  private static drawLineComponentAtStartOfBranch({
    firstChildStepPosition,
    branchStep,
    stepLocationRelativeToParent,
  }: {
    firstChildStepPosition: Position;
    branchStep: BranchAction | PieceAction;
    stepLocationRelativeToParent: StepLocationRelativeToParent;
  }) {
    const doesBranchHaveChildren = BranchDrawer.doesBranchHaveChildren(
      branchStep,
      stepLocationRelativeToParent
    );
    return drawLineComponentWithButton({
      from: {
        x: FlowDrawer.centerBottomOfFlowItemUi.x,
        y: FlowDrawer.centerBottomOfFlowItemUi.y,
      },
      to: {
        x: firstChildStepPosition.x + FLOW_ITEM_WIDTH / 2.0,
        y: firstChildStepPosition.y,
      },
      stepName: branchStep.name,
      stepLocationRelativeToParent: stepLocationRelativeToParent,
      btnType: doesBranchHaveChildren ? 'small' : 'big',
      drawArrow: doesBranchHaveChildren,
      lineHasLabel: true,
    });
  }
  private static drawLineComponentAfterBranch({
    drawerMovedToFirstChildStep,
    branchStep,
    maximumHeight,
  }: {
    drawerMovedToFirstChildStep: FlowDrawer;
    branchStep: BranchAction | PieceAction;
    maximumHeight: number;
  }) {
    return drawLineComponentForStepWithChildren({
      from: {
        x: drawerMovedToFirstChildStep.steps[0].center('bottom').x,
        y:
          drawerMovedToFirstChildStep.steps[0].y +
          drawerMovedToFirstChildStep.boundingBox().height,
      },
      to: {
        x: FlowDrawer.centerBottomOfFlowItemUi.x,
        y:
          FlowDrawer.centerBottomOfFlowItemUi.y +
          VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD * 2 +
          maximumHeight,
      },
      drawArrow: !flowHelper.isStepLastChildOfParent(
        branchStep,
        FlowDrawer.trigger
      ),
      lineHasLabel: false,
    });
  }

  private static createAfterBranchStepButton({
    afterBranchLineComponent,
    branchStep,
  }: {
    afterBranchLineComponent: SvgDrawer;
    branchStep: BranchAction | PieceAction;
  }): PositionButton {
    return {
      stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
      stepName: branchStep.name,
      type: 'small',
      x: afterBranchLineComponent.minimumX() - BUTTON_SIZE / 2.0,
      y:
        afterBranchLineComponent.maximumY() -
        VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS / 2 -
        BUTTON_SIZE / 2.0,
    };
  }

  private static setLabel(index: number, outputs?: ActionOutput): string {
    if (outputs) {
      return $localize`${capitalizeFirstLetter(Object.keys(outputs)[index])}`;
    }
    return index === 0 ? $localize`True` : $localize`False`;
  }
}
