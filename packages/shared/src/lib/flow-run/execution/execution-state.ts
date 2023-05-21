import {LoopOnItemsStepOutput, StepOutput} from './step-output';

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
    const targetMap: Record<string, StepOutput> = this.getTargetMap(ancestors);
    targetMap[stepName] = stepOutput;
    this.updateLastStep(stepOutput.output, stepName);
  }

  updateLastStep(outputOnly: unknown, stepName: string) {
    this.lastStepState[stepName] = ExecutionState.deepClone(outputOnly);
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
      // get loopStepOutput
      if (targetMap[parent[0]] === undefined) {
        throw 'Error in ancestor tree';
      }
      const targetStepOutput = targetMap[parent[0]];
      if (!(targetStepOutput instanceof LoopOnItemsStepOutput)) {
        throw 'Error in ancestor tree, Not instance of Loop On Items step output';
      }
      const loopOutput = targetStepOutput as LoopOnItemsStepOutput;
      targetMap = loopOutput.output!.iterations[parent[1]];
    });
    return targetMap;
  }
}
