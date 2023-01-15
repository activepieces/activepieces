import { FlowExecutor } from '../executors/flow-executor';
import { VariableService } from '../services/variable-service';
import { ExecutionState, LoopOnItemsAction } from 'shared';
import { BaseActionHandler } from './action-handler';
import { LoopOnItemsStepOutput, StepOutputStatus, StepOutput } from 'shared';
import { globals } from '../globals';

export class LoopOnItemActionHandler extends BaseActionHandler<LoopOnItemsAction> {
  firstLoopAction?: BaseActionHandler<any>;
  action: LoopOnItemsAction;
  variableService: VariableService;

  constructor(
    action: LoopOnItemsAction,
    firstLoopAction: BaseActionHandler<any> | undefined,
    nextAction: BaseActionHandler<any> | undefined
  ) {
    super(action, nextAction);
    this.action = action;
    this.variableService = new VariableService(globals.workerToken);
    this.firstLoopAction = firstLoopAction;
  }

  private getError(stepOutput: LoopOnItemsStepOutput) {
    if (stepOutput.output?.iterations === undefined) {
      throw new Error("Iteration can't be undefined");
    }
    for (const iteration of stepOutput.output?.iterations) {
      for (const stepOutput of Object.values(iteration)) {
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
    const resolvedInput = await this.variableService.resolve(
      this.action.settings,
      executionState
    );

    const stepOutput = new LoopOnItemsStepOutput();
    stepOutput.input = resolvedInput;

    stepOutput.output = {
      current_iteration: 1,
      current_item: undefined,
      iterations: []
    };
    executionState.insertStep(stepOutput, this.action.name, ancestors);
    const loopOutput = stepOutput.output;
    try {
      for (let i = 0; i < resolvedInput.items.length; ++i) {
        ancestors.push([this.action.name, i]);

        loopOutput.current_iteration = i + 1;
        loopOutput.current_item = resolvedInput.items[i];
        loopOutput.iterations.push({});
        this.updateExecutionStateWithLoopDetails(executionState, loopOutput);

        if (this.firstLoopAction === undefined) {
          ancestors.pop();
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
      executionState.insertStep(stepOutput, this.action.name, ancestors);

      return Promise.resolve(stepOutput);
    } catch (e) {
      console.error(e);
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
        iterations: undefined
      },
      this.action.name
    );
  }
}
