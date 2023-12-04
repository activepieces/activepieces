import {
  BranchAction,
  StepLocationRelativeToParent,
  flowHelper,
} from '@activepieces/shared';
import { FlowDrawer } from './flow-drawer';
import {
  SvgDrawer,
  drawStartLineForStepWithChildren,
  drawLineComponentWithButton,
} from './svg-drawer';
import {
  BUTTON_SIZE,
  FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING,
  FLOW_ITEM_WIDTH,
  HORIZONTAL_SPACE_BETWEEN_BRANCHES,
  PositionButton,
  VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
  VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
} from './draw-common';
import { Position } from './step-card';

export class BranchDrawer {
  static handleBranchAction(branchStep: BranchAction): FlowDrawer {
    let resultDrawer = new FlowDrawer({
      buttons: [],
      svg: SvgDrawer.empty(),
      steps: [],
    });
    const actions = [branchStep.onSuccessAction, branchStep.onFailureAction];
    const branchesDrawers: FlowDrawer[] = actions.map((action) =>
      FlowDrawer.construct(action)
    );

    const { maximumHeight, xOfFartherestLeftChild } =
      BranchDrawer.calculateDimensionsForBranch(branchesDrawers);

    let leftStartingPoint = xOfFartherestLeftChild;
    branchesDrawers.forEach((bd, index) => {
      const firstChildStepPosition = {
        x:
          leftStartingPoint +
          (bd.boundingBox().width - FLOW_ITEM_WIDTH) / 2.0 +
          FLOW_ITEM_WIDTH / 2.0,
        y:
          FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING +
          VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
      };
      const drawerMovedToFirstChildStep = bd.offset(
        firstChildStepPosition.x,
        firstChildStepPosition.y
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
          drawerMovedToFirstChildStep,
          branchStep,
          maximumHeight,
        });

      resultDrawer = resultDrawer
        .mergeChild(drawerMovedToFirstChildStep)
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
    const widthOfAllChildGraph: number = branches.reduce(
      (sum: number, branch: FlowDrawer) => sum + branch.boundingBox().width,
      0
    );
    const widthOfGraph =
      widthOfAllChildGraph +
      HORIZONTAL_SPACE_BETWEEN_BRANCHES * (branches.length - 1);
    return {
      maximumHeight,
      xOfFartherestLeftChild: -(widthOfGraph / 2.0),
    };
  }

  private static drawLineComponentAtStartOfBranch({
    firstChildStepPosition,
    branchStep,
    stepLocationRelativeToParent,
  }: {
    firstChildStepPosition: Position;
    branchStep: BranchAction;
    stepLocationRelativeToParent: StepLocationRelativeToParent;
  }) {
    return drawLineComponentWithButton({
      from: { x: FlowDrawer.centerBottom.x, y: FlowDrawer.centerBottom.y },
      to: {
        x: firstChildStepPosition.x + FLOW_ITEM_WIDTH / 2.0,
        y: firstChildStepPosition.y,
      },
      stepName: branchStep.name,
      stepLocationRelativeToParent: stepLocationRelativeToParent,
      btnType:
        (stepLocationRelativeToParent ===
          StepLocationRelativeToParent.INSIDE_TRUE_BRANCH &&
          branchStep.onSuccessAction) ||
        (stepLocationRelativeToParent ===
          StepLocationRelativeToParent.INSIDE_FALSE_BRANCH &&
          branchStep.onFailureAction)
          ? 'small'
          : 'big',
      isLastChildStep: flowHelper.isStepLastChildOfParent(
        branchStep,
        FlowDrawer.trigger
      ),
    });
  }
  private static drawLineComponentAfterBranch({
    drawerMovedToFirstChildStep,
    branchStep,
    maximumHeight,
  }: {
    drawerMovedToFirstChildStep: FlowDrawer;
    branchStep: BranchAction;
    maximumHeight: number;
  }) {
    return drawStartLineForStepWithChildren(
      {
        x: drawerMovedToFirstChildStep.steps[0].center('bottom').x,
        y:
          drawerMovedToFirstChildStep.steps[0].y +
          drawerMovedToFirstChildStep.boundingBox().height,
      },
      {
        x: FlowDrawer.centerBottom.x,
        y:
          FlowDrawer.centerBottom.y +
          VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD +
          maximumHeight +
          VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD,
      },
      !flowHelper.isStepLastChildOfParent(branchStep, FlowDrawer.trigger)
    );
  }

  private static createAfterBranchStepButton({
    afterBranchLineComponent,
    branchStep,
  }: {
    afterBranchLineComponent: SvgDrawer;
    branchStep: BranchAction;
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
}
