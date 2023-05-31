import {
  ActionType,
  BranchAction,
  FlowVersion,
  LoopOnItemsAction,
  Trigger,
} from '@activepieces/shared';
import { FlowStructureUtil } from './flowStructureUtil';
import { FLOW_ITEM_HEIGHT, FLOW_ITEM_WIDTH } from './draw-utils';
import { ActionFlowItem, FlowItem } from '../model/flow-item';

export class FlowFactoryUtil {
  public static createRootStep(flowVersion: FlowVersion): FlowItem | undefined {
    if (flowVersion.trigger) {
      const newFlow = FlowFactoryUtil.addCordDetails(flowVersion.trigger);
      FlowFactoryUtil.buildHelper(newFlow);
      return newFlow;
    }
    return undefined;
  }

  private static createStepFromAction(
    content: ActionFlowItem | undefined
  ): ActionFlowItem | undefined {
    if (content === undefined || content === null) {
      return undefined;
    } else {
      const clonedContent: ActionFlowItem = { ...content };
      const simple = this.addCordDetails(clonedContent) as ActionFlowItem;
      FlowFactoryUtil.buildHelper(simple);
      return simple;
    }
  }

  private static addCordDetails(content: FlowItem): FlowItem {
    const cordDetails = {
      width: FLOW_ITEM_WIDTH,
      height: FLOW_ITEM_HEIGHT,
      xOffset: 0,
      yOffset: 0,
      boundingBox: { width: 0, height: 0 },
    };
    return { ...content, ...cordDetails };
  }

  private static buildHelper(flowItemData: FlowItem) {
    if (!flowItemData) {
      return;
    }
    if (FlowStructureUtil.isTrigger(flowItemData)) {
      const trigger = flowItemData as Trigger;
      const nextAction = trigger.nextAction;
      if (nextAction) {
        flowItemData.nextAction =
          FlowFactoryUtil.createStepFromAction(nextAction);
      }
    } else {
      const action = flowItemData;
      if (action.nextAction) {
        flowItemData.nextAction = FlowFactoryUtil.createStepFromAction(
          action.nextAction
        );
      }
      if (action.type === ActionType.BRANCH) {
        const branchAction = action as BranchAction;
        if (branchAction.onSuccessAction) {
          branchAction.onSuccessAction = FlowFactoryUtil.createStepFromAction(
            branchAction.onSuccessAction
          );
        }
        if (branchAction.onFailureAction) {
          branchAction.onFailureAction = FlowFactoryUtil.createStepFromAction(
            branchAction.onFailureAction
          );
        }
      }
      if (action.type === ActionType.LOOP_ON_ITEMS) {
        const loopAction = action as LoopOnItemsAction;
        if (loopAction.firstLoopAction) {
          loopAction.firstLoopAction = FlowFactoryUtil.createStepFromAction(
            loopAction.firstLoopAction
          );
        }
      }
    }
  }
}
