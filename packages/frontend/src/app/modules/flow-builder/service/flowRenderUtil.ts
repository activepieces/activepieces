import { AddButtonAndFlowItemNameContainer } from '../../common/model/flow-builder/flow-add-button';
import { Point } from '../../common/model/helper/point';
import { FlowItem } from '../../common/model/flow-builder/flow-item';
import {
  ARC_LENGTH,
  EMPTY_LOOP_ADD_BUTTON_HEIGHT,
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
  SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
  VERTICAL_LINE_LENGTH,
} from '../page/flow-builder/flow-item-tree/flow-item/flow-item-connection/draw-utils';
import {
  Action,
  ActionType,
  BranchAction,
  LoopOnItemsAction,
} from '@activepieces/shared';

export class FlowRenderUtil {
  public static isButtonWithinCandidateDistance(
    addButton: AddButtonAndFlowItemNameContainer,
    dropPoint: Point
  ) {
    if (dropPoint === null) return false;
    const buttonRect = addButton.htmlElementForButton.getBoundingClientRect();
    const distance = FlowRenderUtil.dist(buttonRect, dropPoint);
    return distance <= ACCEPTED_DISTANCE_BETWEEN_DROP_POINT_AND_ADD_BUTTON;
  }

  public static dist(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public static buildBoxes(flowItem: FlowItem | undefined): void {
    if (!flowItem) {
      return;
    }
    if (!flowItem.boundingBox) {
      flowItem.boundingBox = {
        width: FLOW_ITEM_WIDTH,
        height: FLOW_ITEM_HEIGHT,
      };
    } else {
      flowItem.boundingBox.height = FLOW_ITEM_HEIGHT;
      flowItem.boundingBox.width = FLOW_ITEM_WIDTH;
    }
    if (flowItem.type == ActionType.LOOP_ON_ITEMS) {
      const loopItem = flowItem as LoopOnItemsAction;
      if (
        loopItem.firstLoopAction !== undefined &&
        loopItem.firstLoopAction !== null
      ) {
        this.buildBoxes(loopItem.firstLoopAction);
      }
      const subGraph = loopItem.firstLoopAction
        ? (loopItem.firstLoopAction as FlowItem).boundingBox!.height
        : EMPTY_LOOP_ADD_BUTTON_HEIGHT +
          VERTICAL_LINE_LENGTH +
          SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;

      const svgBoxHeight =
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        VERTICAL_LINE_LENGTH +
        ARC_LENGTH +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        subGraph +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH;
      flowItem.connectionsBox = {
        width: FLOW_ITEM_WIDTH,
        height: svgBoxHeight,
      };
    } else if (flowItem.type === ActionType.BRANCH) {
      const branchItem = flowItem as BranchAction;
      if (
        branchItem.onFailureAction !== undefined &&
        branchItem.onFailureAction !== null
      ) {
        this.buildBoxes(branchItem.onFailureAction);
      }
      if (
        branchItem.onSuccessAction !== undefined &&
        branchItem.onSuccessAction !== null
      ) {
        this.buildBoxes(branchItem.onSuccessAction);
      }

      let subGraphHeight =
        EMPTY_LOOP_ADD_BUTTON_HEIGHT + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
      if (branchItem.onFailureAction && branchItem.onSuccessAction) {
        subGraphHeight = Math.max(
          (branchItem.onFailureAction as FlowItem).boundingBox!.height,
          (branchItem.onSuccessAction as FlowItem).boundingBox!.height
        );
      } else if (branchItem.onSuccessAction) {
        subGraphHeight = Math.max(
          subGraphHeight,
          (branchItem.onSuccessAction as FlowItem).boundingBox!.height
        );
      } else if (branchItem.onFailureAction) {
        subGraphHeight = Math.max(
          subGraphHeight,
          (branchItem.onFailureAction as FlowItem).boundingBox!.height
        );
      }
      const svgBoxHeight =
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        subGraphHeight +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH +
        VERTICAL_LINE_LENGTH +
        VERTICAL_LINE_LENGTH * 0.25;

      flowItem.connectionsBox = {
        width: FLOW_ITEM_WIDTH,
        height: svgBoxHeight,
      };
    } else {
      flowItem.connectionsBox = {
        width: FLOW_ITEM_WIDTH,
        height: SPACE_BETWEEN_ITEM_CONTENT_AND_LINE + VERTICAL_LINE_LENGTH,
      };
    }
    flowItem.boundingBox.height += flowItem.connectionsBox.height;
    this.buildBoxes(flowItem.nextAction);
    if (flowItem.nextAction !== undefined && flowItem.nextAction !== null) {
      flowItem.connectionsBox.height += SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
      flowItem.boundingBox.height +=
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        flowItem.nextAction?.boundingBox!.height;
    }
  }

  public static buildCoordinates(step: FlowItem): void {
    if (!step) {
      return;
    }

    const simpleStep = step;
    if (simpleStep.nextAction) {
      simpleStep.nextAction.xOffset = 0;
      /*      simpleAction.nextAction.yOffset = FlowRendererService.SPACING_VERTICAL;*/
      this.buildCoordinates(simpleStep.nextAction);
    }
  }
  public static findNumberOfNestedBranches(step: Action | undefined): number {
    if (!step) return 0;
    if (step.type === ActionType.BRANCH) {
      return Math.max(
        1 +
          this.findNumberOfNestedBranches(step.onFailureAction) +
          this.findNumberOfNestedBranches(step.onSuccessAction),
        FlowRenderUtil.findNumberOfNestedBranches(step.nextAction)
      );
    }
    return FlowRenderUtil.findNumberOfNestedBranches(step.nextAction);
  }
}

//check scss in simple-line-connection
export const ACCEPTED_DISTANCE_BETWEEN_DROP_POINT_AND_ADD_BUTTON = 250;
