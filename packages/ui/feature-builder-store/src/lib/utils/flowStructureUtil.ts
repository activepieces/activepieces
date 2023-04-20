import {
  ActionType,
  BranchAction,
  FlowVersion,
  LoopOnItemsAction,
  Trigger,
  TriggerType,
} from '@activepieces/shared';
import { FlowItem } from '../model/flow-item';

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
    mainStep: FlowItem | Trigger | undefined,
    includeBranches: boolean
  ): FlowItem[] {
    if (mainStep === undefined) {
      return [];
    }
    const steps: FlowItem[] = [];
    if (mainStep.type !== ActionType.BRANCH || includeBranches) {
      steps.push(mainStep);
    }
    const branches = FlowStructureUtil.branches(mainStep);
    for (let i = 0; i < branches.length; ++i) {
      const subSteps = this.traverseAllSteps(branches[i], includeBranches);
      for (let i = 0; i < subSteps.length; ++i) {
        steps.push(subSteps[i]);
      }
    }
    return steps;
  }

  public static branches(mainPiece: FlowItem | Trigger): FlowItem[] {
    const branches: FlowItem[] = [];
    if (mainPiece.type === ActionType.LOOP_ON_ITEMS) {
      const loopAction = mainPiece as LoopOnItemsAction;
      if (loopAction.firstLoopAction) {
        branches.push(loopAction.firstLoopAction);
      }
    }
    if (mainPiece.type === ActionType.BRANCH) {
      const branchAction = mainPiece as BranchAction;
      if (branchAction.onFailureAction) {
        branches.push(branchAction.onFailureAction);
      }
      if (branchAction.onSuccessAction) {
        branches.push(branchAction.onSuccessAction);
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
    const steps = FlowStructureUtil.traverseAllSteps(flowVersion.trigger, true);
    let number = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let exist = false;
      for (let i = 0; i < steps.length; ++i) {
        const step = steps[i];
        if (step.name === stepPrefix.toString().toLowerCase() + '_' + number) {
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

  private static _findPathToStep(
    stepToFind: FlowItem,
    stepToSearch: FlowItem | undefined
  ): FlowItem[] | undefined {
    if (stepToSearch === undefined) {
      return undefined;
    }
    if (stepToFind.name === stepToSearch.name) {
      return [];
    }
    const pathFromNextAction = this._findPathToStep(
      stepToFind,
      stepToSearch.nextAction
    );
    if (pathFromNextAction) {
      if (
        stepToSearch.type !== ActionType.BRANCH &&
        stepToSearch.type !== ActionType.LOOP_ON_ITEMS
      ) {
        return [stepToSearch, ...pathFromNextAction];
      }
      return [...pathFromNextAction];
    }
    const pathFromTrueBranch = this._findPathToStep(
      stepToFind,
      (stepToSearch as BranchAction).onSuccessAction
    );
    if (pathFromTrueBranch) {
      return [...pathFromTrueBranch];
    }
    const pathFromFalseBranch = this._findPathToStep(
      stepToFind,
      (stepToSearch as BranchAction).onFailureAction
    );
    if (pathFromFalseBranch) {
      return [...pathFromFalseBranch];
    }
    const pathFromLoop = this._findPathToStep(
      stepToFind,
      (stepToSearch as LoopOnItemsAction).firstLoopAction
    );
    if (pathFromLoop) {
      return [stepToSearch, ...pathFromLoop];
    }

    return undefined;
  }

  public static findPathToStep(
    stepToFind: FlowItem,
    trigger: Trigger
  ): FlowItem[] {
    if (stepToFind.name === trigger.name) {
      return [];
    }
    const path = this._findPathToStep(stepToFind, trigger.nextAction);
    if (!path) {
      throw new Error('Step not found while traversing to find it ');
    }
    if (trigger.nextAction) {
      this.findIndeciesInDfsOrder(path, trigger.nextAction, { value: 2 });
    }
    return [trigger, ...path];
  }
  private static findIndeciesInDfsOrder(
    path: FlowItem[],
    action: FlowItem,
    idx: { value: number }
  ) {
    const actionIndexInPath = path.findIndex((a) => a === action);
    if (actionIndexInPath > -1) {
      path[actionIndexInPath] = {
        ...path[actionIndexInPath],
        indexInDfsTraversal: idx.value,
      };
    }
    idx.value++;
    const branchAction: BranchAction = action as BranchAction;
    if (branchAction.onSuccessAction) {
      this.findIndeciesInDfsOrder(path, branchAction.onSuccessAction, idx);
    }
    if (branchAction.onFailureAction) {
      this.findIndeciesInDfsOrder(path, branchAction.onFailureAction, idx);
    }
    const loopOnItemsAction: LoopOnItemsAction = action as LoopOnItemsAction;
    if (loopOnItemsAction.firstLoopAction) {
      this.findIndeciesInDfsOrder(path, loopOnItemsAction.firstLoopAction, idx);
    }
    if (action.nextAction) {
      this.findIndeciesInDfsOrder(path, action.nextAction, idx);
    }
  }
}
