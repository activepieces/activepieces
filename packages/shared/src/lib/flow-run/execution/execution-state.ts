import {LoopOnItemsStepOutput, StepOutput} from './step-output';

export class ExecutionState {
  configs: Record<string, unknown>;
  steps: Record<string, StepOutput>;
  lastStepState: Record<string, unknown>;

  constructor() {
    this.configs = {};
    this.steps = {};
    this.lastStepState = {};
  }

  insertStep(
    stepOutput: StepOutput,
    actionName: string,
    ancestors: [string, number][]
  ) {
    const targetMap: Record<string, StepOutput> = this.getTargetMap(ancestors);
    targetMap[actionName] = stepOutput;
    this.updateLastStep(stepOutput.output, actionName);
  }

  updateLastStep(outputOnly: any, actionName: string) {
    this.lastStepState[actionName] = ExecutionState.deepClone(outputOnly);
  }

  private static deepClone(value: any) {
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
