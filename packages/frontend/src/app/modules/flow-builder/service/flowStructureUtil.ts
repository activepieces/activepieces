import { FlowItem } from '../../common/model/flow-builder/flow-item';
import {
  ActionType,
  FlowVersion,
  LoopOnItemsAction,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

export class FlowStructureUtil {
  static isAction(piece: FlowItem): boolean {
    const type = piece.type;
    if (type == undefined) {
      return false;
    }
    return Object.values(ActionType).includes(type as ActionType);
  }

  static isTrigger(piece: FlowItem): boolean {
    const type = piece.type;
    if (type == undefined) {
      return false;
    }
    return Object.values(TriggerType).includes(type as TriggerType);
  }

  public static findParent(
    mainPiece: FlowItem | Trigger | undefined,
    targetStepName: string
  ): FlowItem | Trigger | undefined {
    if (mainPiece === undefined) {
      return undefined;
    }
    const branches = FlowStructureUtil.branches(mainPiece);
    for (let i = 0; i < branches.length; ++i) {
      const parent = this.findParent(branches[i], targetStepName);
      if (branches[i].name === targetStepName) {
        return mainPiece;
      }
      if (parent !== undefined) {
        return parent;
      }
    }
    return undefined;
  }

  public static traverseAllSteps(
    mainPiece: FlowItem | Trigger | undefined
  ): FlowItem[] {
    if (mainPiece === undefined) {
      return [];
    }
    const steps: FlowItem[] = [mainPiece];
    const branches = FlowStructureUtil.branches(mainPiece);
    for (let i = 0; i < branches.length; ++i) {
      const subSteps = this.traverseAllSteps(branches[i]);
      for (let i = 0; i < subSteps.length; ++i) {
        steps.push(subSteps[i]);
      }
    }
    return steps;
  }

  public static findStep(
    mainPiece: FlowItem | Trigger | undefined,
    targetStepName: string
  ): FlowItem | Trigger | undefined {
    if (mainPiece === undefined) {
      return undefined;
    }
    if (mainPiece.name === targetStepName) {
      return mainPiece;
    }
    const branches = FlowStructureUtil.branches(mainPiece);
    for (let i = 0; i < branches.length; ++i) {
      const action = this.findStep(branches[i], targetStepName);
      if (action !== undefined) {
        return action;
      }
    }
    return undefined;
  }

  public static branches(mainPiece: FlowItem | Trigger): FlowItem[] {
    const branches: FlowItem[] = [];
    if (mainPiece.type === ActionType.LOOP_ON_ITEMS) {
      const loopAction = mainPiece as LoopOnItemsAction;
      if (loopAction.firstLoopAction) {
        branches.push(loopAction.firstLoopAction);
      }
    }
    const nextAction = mainPiece.nextAction;
    if (nextAction) {
      branches.push(nextAction);
    }
    return branches;
  }

  public static findAvailableName(
    flowVersion: FlowVersion,
    stepPrefix: string
  ) {
    const steps = FlowStructureUtil.traverseAllSteps(flowVersion.trigger);
    let number = 1;
    while (true) {
      let exist = false;
      for (let i = 0; i < steps.length; ++i) {
        const action = steps[i];
        if (
          action.name ===
          stepPrefix.toString().toLowerCase() + '_' + number
        ) {
          exist = true;
          break;
        }
      }
      if (exist) {
        number++;
      } else {
        break;
      }
    }
    return stepPrefix.toString().toLowerCase() + '_' + number;
  }
}
