import {FlowExecutor} from '../../../executors/flow-executor';
import {ExecutionState} from '../../execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../output/step-output';
import {LoopOnItemsStepOutput} from '../../output/loop-on-items-step-output';
import {VariableService} from '../../../services/variable-service';
import {StoreScope} from '../../util/store-scope';
import {ActionMetadata, ActionType} from "../action-metadata";

export class LoopOnItemActionSettings {
  items: string;

  constructor(items: string) {
    this.validate(items);
    this.items = items;
  }

  validate(items: string) {
    if (!items) {
      throw Error('Settings "items" attribute is undefined.');
    }
  }

  static deserialize(jsonData: any): LoopOnItemActionSettings {
    return new LoopOnItemActionSettings(jsonData['items'] as string);
  }
}

export class LoopOnItemAction extends ActionMetadata {
  firstLoopAction?: ActionMetadata;
  settings: LoopOnItemActionSettings;
  variableService: VariableService;

  constructor(
    type: ActionType,
    name: string,
    settings: LoopOnItemActionSettings,
    firstLoopAction?: ActionMetadata,
    nextAction?: ActionMetadata
  ) {
    super(type, name, nextAction);
    this.settings = settings;
    this.variableService = new VariableService();
    this.firstLoopAction = firstLoopAction;
  }

  private getError(stepOutput: LoopOnItemsStepOutput) {
    if (stepOutput.output?.iterations === undefined) {
      throw new Error("Iteration can't be undefined");
    }
    for (const iteration of stepOutput.output?.iterations) {
      for (const stepOutput of Object.values(iteration.values)) {
        if (stepOutput.status === StepOutputStatus.FAILED) {
          return stepOutput.errorMessage;
        }
      }
    }
    return undefined;
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][],
    storeScope: StoreScope
  ): Promise<StepOutput> {
    const resolvedInput = this.variableService.resolve(
      this.settings,
      executionState
    );

    const stepOutput = new LoopOnItemsStepOutput();
    stepOutput.input = resolvedInput;

    stepOutput.output = {
      current_iteration: 1,
      current_item: undefined,
      iterations: [],
    };
    executionState.insertStep(stepOutput, this.name, ancestors);
    const loopOutput = stepOutput.output;
    try {
      for (let i = 0; i < resolvedInput.items.length; ++i) {
        ancestors.push([this.name, i]);

        loopOutput.current_iteration = i + 1;
        loopOutput.current_item = resolvedInput.items[i];
        loopOutput.iterations.push({});
        this.updateExecutionStateWithLoopDetails(executionState, loopOutput);

        if (this.firstLoopAction === undefined) {
          continue;
        }

        const executor = new FlowExecutor(executionState);
        const loopStatus = await executor.iterateFlow(
          this.firstLoopAction,
          ancestors,
          storeScope
        );

        ancestors.pop();

        if (!loopStatus) {
          stepOutput.status = StepOutputStatus.FAILED;
          stepOutput.errorMessage = this.getError(stepOutput);
          return Promise.resolve(stepOutput);
        }
      }

      stepOutput.status = StepOutputStatus.SUCCEEDED;
      executionState.insertStep(stepOutput, this.name, ancestors);
      return Promise.resolve(stepOutput);
    } catch (e) {
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return Promise.resolve(stepOutput);
    }
  }

  // We should remove iterations during the inner calls, to avoid huge overhead for logs.
  // Example if there are two nested loop contains code that reference to the first loop.
  // The iteration object will always contain all previous iterations.
  updateExecutionStateWithLoopDetails(
    executionState: ExecutionState,
    loopOutput: any
  ) {
    executionState.updateLastStep(
      {
        ...loopOutput,
        iterations: undefined,
      },
      this.name
    );
  }
}
