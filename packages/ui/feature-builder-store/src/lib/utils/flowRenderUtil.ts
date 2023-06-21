import { ActionFlowItem, FlowItem } from '../model/flow-item';
import {
  ARC_LENGTH,
  EMPTY_LOOP_ADD_BUTTON_HEIGHT,
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
  SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
  VERTICAL_LINE_LENGTH,
} from '../utils/draw-utils';
import {
  Action,
  ActionType,
  BranchAction,
  LoopOnItemsAction,
} from '@activepieces/shared';

export class FlowRenderUtil {
  public static buildBoxes(
    originalFlowItem: FlowItem | undefined
  ): FlowItem | undefined {
    if (!originalFlowItem) {
      return undefined;
    }
    const flowItem: FlowItem = { ...originalFlowItem };
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
        flowItem.firstLoopAction = this.buildBoxes(
          loopItem.firstLoopAction
        ) as ActionFlowItem;
      }
      const subGraph = loopItem.firstLoopAction
        ? (loopItem.firstLoopAction as FlowItem).boundingBox?.height || 0
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
        flowItem.onFailureAction = this.buildBoxes(
          branchItem.onFailureAction
        ) as ActionFlowItem;
      }
      if (
        branchItem.onSuccessAction !== undefined &&
        branchItem.onSuccessAction !== null
      ) {
        branchItem.onSuccessAction = this.buildBoxes(
          branchItem.onSuccessAction
        ) as ActionFlowItem;
      }

      let subGraphHeight =
        EMPTY_LOOP_ADD_BUTTON_HEIGHT + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
      if (branchItem.onFailureAction && branchItem.onSuccessAction) {
        subGraphHeight = Math.max(
          (branchItem.onFailureAction as FlowItem).boundingBox?.height || 0,
          (branchItem.onSuccessAction as FlowItem).boundingBox?.height || 0
        );
      } else if (branchItem.onSuccessAction) {
        subGraphHeight = Math.max(
          subGraphHeight,
          (branchItem.onSuccessAction as FlowItem).boundingBox?.height || 0
        );
      } else if (branchItem.onFailureAction) {
        subGraphHeight = Math.max(
          subGraphHeight,
          (branchItem.onFailureAction as FlowItem).boundingBox?.height || 0
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
    flowItem.nextAction = this.buildBoxes(flowItem.nextAction);
    if (flowItem.nextAction !== undefined && flowItem.nextAction !== null) {
      flowItem.connectionsBox.height += SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
      flowItem.boundingBox.height +=
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
          flowItem.nextAction?.boundingBox?.height || 0;
    }
    return flowItem;
  }

  public static findNumberOfNestedBranches(step: Action | undefined): number {
    if (!step) return 0;
    if (step.type === ActionType.BRANCH) {
      return (
        1 +
        this.findNumberOfNestedBranches(step.onFailureAction) +
        this.findNumberOfNestedBranches(step.onSuccessAction) +
        FlowRenderUtil.findNumberOfNestedBranches(step.nextAction)
      );
    }
    if (step.type === ActionType.LOOP_ON_ITEMS) {
      return (
        1 +
        this.findNumberOfNestedBranches(step.firstLoopAction) +
        FlowRenderUtil.findNumberOfNestedBranches(step.nextAction)
      );
    }
    return FlowRenderUtil.findNumberOfNestedBranches(step.nextAction);
  }
}

//check scss in simple-line-connection
export const ACCEPTED_DISTANCE_BETWEEN_DROP_POINT_AND_ADD_BUTTON = 250;
