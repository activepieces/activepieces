import {StepOutput} from '../output/step-output';
import {LoopOnItemsStepOutput} from '../output/loop-on-items-step-output';

export class ExecutionState {
  configs: Map<string, any>;
  steps: Map<string, StepOutput>;

  constructor() {
    this.configs = new Map<string, any>();
    this.steps = new Map<string, StepOutput>();
  }

  insertConfigs(configs: any) {
    if (configs instanceof Map) {
      configs.forEach((value: any, key: string) => {
        this.configs.set(key, value);
      });
    } else if (Array.isArray(configs)) {
      configs.forEach(config => this.insertConfigs(config));
    } else if (typeof configs === 'object') {
      Object.entries(configs).forEach(([key, value]) => {
        this.configs.set(key, value);
      });
    } else {
      throw Error(`Invalid configs type: ${typeof configs}`);
    }
  }

  insertStep(
    stepOutput: StepOutput,
    actionName: string,
    ancestors: [string, number][]
  ) {
    const targetMap: Map<string, StepOutput> = this.getTargetMap(ancestors);
    targetMap.set(actionName, stepOutput);
  }

  getStep(actionName: string, ancestors: [string, number][]) {
    const targetMap: Map<string, StepOutput> = this.getTargetMap(ancestors);
    return targetMap.get(actionName);
  }

  private getTargetMap(ancestors: [string, number][]): Map<string, StepOutput> {
    let targetMap = this.steps;
    ancestors.forEach(parent => {
      // get loopStepOutput
      if (targetMap.get(parent[0]) === undefined) {
        throw 'Error in ancestor tree';
      }
      const targetStepOutput = targetMap.get(parent[0]);
      if (!(targetStepOutput instanceof LoopOnItemsStepOutput)) {
        throw 'Error in ancestor tree';
      }
      targetMap = targetStepOutput.iterations[parent[1]];
    });
    return targetMap;
  }
}
