import { FlowItem } from '../../common/model/flow-builder/flow-item';
import {
  ActionType,
  Flow,
  LoopOnItemsAction,
  Trigger,
} from '@activepieces/shared';
import { FlowStructureUtil } from './flowStructureUtil';
import {
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
} from '../page/flow-builder/flow-item-tree/flow-item/flow-item-connection/draw-utils';

export class FlowFactoryUtil {
  constructor() {}

  public static createRootStep(flow: Flow): FlowItem | undefined {
    const latestVersion = flow.version!;
    if (latestVersion.trigger) {
      const newFlow = FlowFactoryUtil.addCordDetails(latestVersion.trigger);
      FlowFactoryUtil.buildHelper(newFlow);
      return newFlow;
    }
    return undefined;
  }

  private static createStepFromAction(
    content: FlowItem | undefined
  ): FlowItem | undefined {
    if (content === undefined || content === null) {
      return undefined;
    } else {
      const clonedContent: FlowItem = { ...content };
      switch (clonedContent.type) {
        case ActionType.CODE:
        case ActionType.LOOP_ON_ITEMS:
        case ActionType.PIECE:
          const simple = this.addCordDetails(clonedContent);
          FlowFactoryUtil.buildHelper(simple);
          return simple;
        default:
          throw new Error('UNSUPPORTED STEP TYPE !');
      }
    }
    return undefined;
  }

  public static addCordDetails(content: FlowItem): FlowItem {
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
      if (trigger.nextAction) {
        flowItemData.nextAction = FlowFactoryUtil.createStepFromAction(
          trigger.nextAction
        )!;
      }
    } else {
      const action = flowItemData;
      if (action.nextAction) {
        flowItemData.nextAction = FlowFactoryUtil.createStepFromAction(
          action.nextAction
        );
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
