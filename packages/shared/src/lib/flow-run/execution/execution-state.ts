import { ActionType } from '../../flows/actions/action';
import {LoopOnItemsStepOutput, StepOutput} from './step-output';

type GetStepOutputParams = {
  stepName: string
  ancestors: [string, number][]
}

export class ExecutionState {
  steps: Record<string, StepOutput> = {};
  lastStepState: Record<string, unknown> = {};

  constructor(executionState?: ExecutionState) {
    if (executionState) {
      this.steps = executionState.steps
      this.lastStepState = executionState.lastStepState
    }
  }

  insertStep(
    stepOutput: StepOutput,
    stepName: string,
    ancestors: [string, number][]
  ) {
    console.log('[ExecutionState#insertStep] stepName:', stepName)
    console.log('[ExecutionState#insertStep] ancestors:', ancestors)

    const targetMap: Record<string, StepOutput> = this.getTargetMap(ancestors);
    targetMap[stepName] = stepOutput;
    this.updateLastStep(stepOutput.output, stepName);
  }

  updateLastStep(outputOnly: unknown, stepName: string) {
    this.lastStepState[stepName] = ExecutionState.deepClone(outputOnly);
  }

  getStepOutput<T extends StepOutput>(params: GetStepOutputParams): T | undefined {
    const { stepName, ancestors } = params

    const targetMap = this.getTargetMap(ancestors)
    return targetMap[stepName] as T
  }

  private static deepClone(value: unknown) {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return JSON.parse(JSON.stringify(value));
  }

  private getTargetMap(
    ancestors: [string, number][]
  ): Record<string, StepOutput> {
    let targetMap = this.steps;

    ancestors.forEach(parent => {
      console.log('[ExecutionState#getTargetMap] parent:', parent)

      // get loopStepOutput
      if (targetMap[parent[0]] === undefined) {
        throw 'Error in ancestor tree';
      }
      const targetStepOutput = targetMap[parent[0]]

      if (targetStepOutput.type !== ActionType.LOOP_ON_ITEMS) {
        throw new Error('[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
      }

      const loopOutput = targetStepOutput as LoopOnItemsStepOutput;
      targetMap = loopOutput.output!.iterations[parent[1]];
    });
    return targetMap;
  }
}
