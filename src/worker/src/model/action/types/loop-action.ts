import {Action, ActionType} from '../action';
import {FlowExecutor} from '../../../executors/flow-executor';
import {ExecutionState} from '../../execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../output/step-output';
import {LoopOnItemsStepOutput} from '../../output/loop-on-items-step-output';

export class LoopOnItemActionSettings {
  items: any[];

  constructor(items: any[]) {
    this.validate(items);
    this.items = items;
  }

  validate(items: any[]) {
    if (!items) {
      throw Error('Settings "items" attribute is undefined.');
    }
  }

  static deserialize(jsonData: any): LoopOnItemActionSettings {
    return new LoopOnItemActionSettings(jsonData['items'] as Array<any>);
  }
}

export class LoopOnItemAction extends Action {
  firstLoopAction?: Action;
  settings: LoopOnItemActionSettings;

  constructor(
    type: ActionType,
    name: string,
    settings: LoopOnItemActionSettings,
    firstLoopAction?: Action,
    nextAction?: Action
  ) {
    super(type, name, nextAction);
    this.settings = settings;
    this.firstLoopAction = firstLoopAction;
  }

  private getError(stepOutput: LoopOnItemsStepOutput) {
    for (const iteration of stepOutput.iterations) {
      for (const stepOutput of iteration.values()) {
        if (stepOutput.status === StepOutputStatus.FAILED) {
          return stepOutput.errorMessage;
        }
      }
    }
    return undefined;
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const stepOutput = new LoopOnItemsStepOutput();
    executionState.insertStep(stepOutput, this.name, ancestors);

    try {
      for (let i = 0; i < this.settings.items.length; ++i) {
        ancestors.push([this.name, i]);
        stepOutput.iterations.push(new Map<string, StepOutput>());

        if (this.firstLoopAction === undefined) {
          continue;
        }

        const executor = new FlowExecutor(executionState);
        const loopStatus = await executor.iterateFlow(
          this.firstLoopAction,
          ancestors
        );

        ancestors.pop();

        if (!loopStatus) {
          stepOutput.status = StepOutputStatus.FAILED;
          stepOutput.errorMessage = this.getError(stepOutput);
          return Promise.resolve(stepOutput);
        }
      }

      stepOutput.status = StepOutputStatus.SUCCEEDED;
      return Promise.resolve(stepOutput);
    } catch (e) {
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return Promise.resolve(stepOutput);
    }
  }
}
