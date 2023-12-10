import {
  Action,
  ActionType,
  BranchAction,
  LoopOnItemsAction,
  Trigger,
  UpdateActionRequest,
  UpdateTriggerRequest,
  flowHelper,
} from '@activepieces/shared';
import { Step, StepWithIndex } from '../model/step';

// TODO REMOVE THIS FILE AND REPLACE IT WITH FUNCTIONS IN flowHelper.ts
export class FlowStructureUtil {
  private static _findPathToStep(
    stepToFind: Step,
    stepToSearch: Step | undefined
  ): Step[] | undefined {
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
    stepToFind: Step,
    trigger: Trigger
  ): StepWithIndex[] {
    if (stepToFind.name === trigger.name) {
      return [];
    }
    const path = this._findPathToStep(stepToFind, trigger.nextAction);
    if (!path) {
      throw new Error('Step not found while traversing to find it ');
    }
    const pathWithIndex = path.map((f) => {
      return {
        ...f,
        indexInDfsTraversal: FlowStructureUtil.findStepIndex(trigger, f.name),
      };
    });
    return [{ ...trigger, indexInDfsTraversal: 1 }, ...pathWithIndex];
  }

  public static findStepIndex(trigger: Trigger, stepName: string) {
    return (
      flowHelper.getAllSteps(trigger).findIndex((f) => stepName === f.name) + 1
    );
  }

  public static removeAnySubequentStepsFromTrigger<T extends Trigger>(
    req: T
  ): UpdateTriggerRequest {
    const clone: Trigger = JSON.parse(JSON.stringify(req));
    if (clone.nextAction) clone.nextAction = undefined;
    return clone;
  }

  public static removeAnySubequentStepsFromAction(
    req: Action
  ): UpdateActionRequest {
    const clone: Action = JSON.parse(JSON.stringify(req));
    if (clone.nextAction) clone.nextAction = undefined;
    switch (clone.type) {
      case ActionType.BRANCH: {
        clone.onFailureAction = undefined;
        clone.onSuccessAction = undefined;
        break;
      }
      case ActionType.LOOP_ON_ITEMS: {
        clone.firstLoopAction = undefined;
        break;
      }
    }
    return clone;
  }
}
