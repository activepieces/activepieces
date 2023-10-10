import {
  ActionType,
  FlowVersion,
  Trigger,
  flowHelper,
} from '@activepieces/shared';
import { FLOW_ITEM_HEIGHT, FLOW_ITEM_WIDTH } from './draw-utils';
import { ActionFlowItem, FlowItem } from '../model/flow-item';

export class FlowFactoryUtil {
  public static createRootStep(flowVersion: FlowVersion): FlowItem | undefined {
    if (flowVersion.trigger) {
      const newFlow = FlowFactoryUtil.addCordDetails(flowVersion.trigger);
      return FlowFactoryUtil.buildHelper(newFlow, {
        value: 1,
      });
    }
    return undefined;
  }

  private static createStepFromAction(
    content: ActionFlowItem | undefined,
    idx: { value: number }
  ): ActionFlowItem | undefined {
    if (content === undefined || content === null) {
      return undefined;
    } else {
      const clonedContent: ActionFlowItem = { ...content };
      const simple = this.addCordDetails(clonedContent);
      return FlowFactoryUtil.buildHelper(simple, idx) as ActionFlowItem;
    }
  }

  private static addCordDetails(content: FlowItem): FlowItem {
    const cordDetails = {
      width: FLOW_ITEM_WIDTH,
      height: FLOW_ITEM_HEIGHT,
      boundingBox: { width: 0, height: 0 },
    };
    return { ...content, ...cordDetails };
  }

  private static buildHelper(
    flowItemData: FlowItem,
    idx: { value: number }
  ): FlowItem | undefined {
    if (!flowItemData) {
      return undefined;
    }
    const modifiedFlowItemData: FlowItem = {
      ...flowItemData,
      indexInDfsTraversal: idx.value,
    };
    idx.value++;
    if (flowHelper.isTrigger(modifiedFlowItemData.type)) {
      const trigger = modifiedFlowItemData as Trigger;
      const nextAction = trigger.nextAction;
      if (nextAction) {
        modifiedFlowItemData.nextAction = FlowFactoryUtil.createStepFromAction(
          nextAction,
          idx
        );
      }
    } else {
      const action = modifiedFlowItemData;
      switch (action.type) {
        case ActionType.BRANCH:
          if (action.onSuccessAction) {
            action.onSuccessAction = FlowFactoryUtil.createStepFromAction(
              action.onSuccessAction,
              idx
            )!;
          }
          if (action.onFailureAction) {
            action.onFailureAction = FlowFactoryUtil.createStepFromAction(
              action.onFailureAction,
              idx
            )!;
          }
          break;
        case ActionType.LOOP_ON_ITEMS:
          if (action.firstLoopAction) {
            action.firstLoopAction = FlowFactoryUtil.createStepFromAction(
              action.firstLoopAction,
              idx
            );
          }
          break;
        case ActionType.CODE:
        case ActionType.PIECE:
          break;
      }
      if (action.nextAction) {
        modifiedFlowItemData.nextAction = FlowFactoryUtil.createStepFromAction(
          action.nextAction,
          idx
        );
      }
    }
    return modifiedFlowItemData;
  }
}
