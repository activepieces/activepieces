import {
  Action,
  ActionType,
  BranchAction,
  LoopOnItemsAction,
  LoopStepOutput,
  StepOutput,
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
  public static getInitialLoopIndexes(
    trigger: Trigger
  ): Record<string, number> {
    return flowHelper
      .getAllSteps(trigger)
      .filter((s) => s.type === ActionType.LOOP_ON_ITEMS)
      .reduce((acc, step) => {
        acc[step.name] = 0;
        return acc;
      }, {} as Record<string, number>);
  }

  public static findStepParents(
    stepName: string,
    step: Action | Trigger
  ): Action[] | undefined {
    if (step.name === stepName) {
      return [];
    }
    if (step.nextAction) {
      const pathFromNextAction = this.findStepParents(
        stepName,
        step.nextAction
      );
      if (pathFromNextAction) {
        return pathFromNextAction;
      }
    }
    if (step.type === ActionType.BRANCH) {
      const pathFromTrueBranch = step.onSuccessAction
        ? this.findStepParents(stepName, step.onSuccessAction)
        : undefined;
      if (pathFromTrueBranch) {
        return [step, ...pathFromTrueBranch];
      }
      const pathFromFalseBranch = step.onFailureAction
        ? this.findStepParents(stepName, step.onFailureAction)
        : undefined;
      if (pathFromFalseBranch) {
        return [step, ...pathFromFalseBranch];
      }
    }
    if (step.type === ActionType.LOOP_ON_ITEMS) {
      const pathFromLoop = step.firstLoopAction
        ? this.findStepParents(stepName, step.firstLoopAction)
        : undefined;
      if (pathFromLoop) {
        return [step, ...pathFromLoop];
      }
    }
    return undefined;
  }
  public static getLoopChildStepOutput(
    parents: Action[],
    loopIndexes: Record<string, number>,
    childName: string,
    output: Record<string, StepOutput>
  ): StepOutput | undefined {
    const parentStepsThatAreLoops = parents.filter(
      (p) => p.type === ActionType.LOOP_ON_ITEMS
    );
    if (parentStepsThatAreLoops.length === 0) return undefined;
    let iterator: LoopStepOutput | undefined = output[
      parentStepsThatAreLoops[0].name
    ] as LoopStepOutput;
    let index = 0;
    while (index < parentStepsThatAreLoops.length - 1) {
      iterator = iterator?.output?.iterations[
        loopIndexes[parentStepsThatAreLoops[index].name]
      ][parentStepsThatAreLoops[index + 1].name] as LoopStepOutput | undefined;
      index++;
    }
    if (iterator) {
      const directParentOutput =
        iterator.output?.iterations[
          loopIndexes[
            parentStepsThatAreLoops[parentStepsThatAreLoops.length - 1].name
          ]
        ];
      //Could be accessing out of bounds iteration
      if (directParentOutput) {
        return directParentOutput[childName];
      }
    }
    return undefined;
  }
  public static extractStepOutput(
    stepName: string,
    loopIndexes: Record<string, number>,
    output: Record<string, StepOutput>,
    trigger: Trigger
  ): StepOutput | undefined {
    const stepOutput = output[stepName];
    if (stepOutput) {
      return stepOutput;
    }
    const parents = FlowStructureUtil.findStepParents(stepName, trigger);
    if (parents) {
      return FlowStructureUtil.getLoopChildStepOutput(
        parents,
        loopIndexes,
        stepName,
        output
      );
    }
    return undefined;
  }
}
