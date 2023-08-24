import { isNil, isString } from '../../common';
import { ActionType } from '../../flows/actions/action';
import { ExecutionOutput } from './execution-output';
import { LoopOnItemsStepOutput, StepOutput } from './step-output';
import sizeof from 'object-sizeof';

const TRIM_SIZE_BYTE = 128 * 1024;
export const MAX_LOG_SIZE = 2048 * 1024;

type GetStepOutputParams = {
  stepName: string
  ancestors: [string, number][]
}

type AdjustTaskCountParams = {
  stepOutput: StepOutput
}

export class ExecutionState {
  private _taskCount = 0
  private _tags: string[] = [];
  steps: Record<string, StepOutput> = {};
  lastStepState: Record<string, unknown> = {};

  constructor(executionState?: ExecutionState) {
    if (executionState) {
      this._taskCount = executionState._taskCount
      this.steps = executionState.steps
      this.lastStepState = executionState.lastStepState
    }
  }

  get tags() {
    return this._tags
  }

  get taskCount() {
    return this._taskCount
  }

  public addTags(tags: string[]) {
    this._tags.push(...tags);
  }

  public addConnectionTags(tags: string[]) {
    this._tags.push(...tags.map(tag => `connection:${tag}`));
    // Sorting the array
    this._tags.sort();

    // Removing duplicates
    this._tags = this._tags.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  private adjustTaskCount({ stepOutput }: AdjustTaskCountParams) {
    const nonCountableSteps = [
      ActionType.BRANCH,
      ActionType.LOOP_ON_ITEMS,
    ]

    const stepIsCountable = !nonCountableSteps.includes(stepOutput.type)

    if (stepIsCountable) {
      this._taskCount += 1
    }
  }

  insertStep(
    stepOutput: StepOutput,
    stepName: string,
    ancestors: [string, number][]
  ) {
    const targetMap: Record<string, StepOutput> = this.getTargetMap(ancestors);

    this.adjustTaskCount({
      stepOutput,
    })

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

export function trimExecution(executionState: ExecutionOutput){
   const steps = executionState.executionState.steps;
   for(const stepName in steps){
      const stepOutput = steps[stepName];
      steps[stepName] = trimStepOuput(stepOutput);
    }
    return executionState;
}

function trimStepOuput(stepOutput: StepOutput): StepOutput {
  const modified: StepOutput = JSON.parse(JSON.stringify(stepOutput));
  modified.input = trimObject(modified.input);
  switch (modified.type) {
    case ActionType.BRANCH:
      break;
    case ActionType.CODE:
    case ActionType.PIECE:
      modified.output = trimObject(modified.output);
      break;
    case ActionType.LOOP_ON_ITEMS: {
      const loopItem = (modified as LoopOnItemsStepOutput).output;
      if(loopItem){
        loopItem.iterations = trimObject(loopItem.iterations);
        loopItem.item = trimObject(loopItem.item);
      }
      break;
    }
  }
  modified.standardOutput = trimObject(modified.standardOutput);
  modified.errorMessage = trimObject(modified.errorMessage);
  return modified;
}

function trimObject(obj: any) {
  if (isNil(obj)) {
    return obj;
  } else if (isString(obj)) {
    return trim(obj);
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; ++i) {
      obj[i] = trimObject(obj[i]);
    }
  } else if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    for (let i = 0; i < entries.length; ++i) {
      const [key, value] = entries[i];
      obj[key] = trimObject(value);
    }
  }
  return trim(obj);
}

const trim = (obj: any) => {
  const size = sizeof(obj);
  if (size > TRIM_SIZE_BYTE) {
    return '(truncated)';
  }
  return obj;
};