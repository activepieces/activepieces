import { FlowExecutor } from '../executors/flow-executor';
import { VariableService } from '../services/variable-service';
import { Action, ExecutionOutputStatus, ExecutionState, LoopOnItemsAction, LoopResumeStepMetadata } from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { LoopOnItemsStepOutput, StepOutputStatus, StepOutput } from '@activepieces/shared';

type CtorParams = {
  currentAction: LoopOnItemsAction
  firstLoopAction?: Action,
  nextAction?: Action
  resumeStepMetadata?: LoopResumeStepMetadata
}

export class LoopOnItemActionHandler extends BaseActionHandler<LoopOnItemsAction> {
  firstLoopAction?: Action
  variableService: VariableService

  constructor({ currentAction, firstLoopAction, nextAction, resumeStepMetadata }: CtorParams) {
    super({
      currentAction,
      nextAction,
      resumeStepMetadata
    })

    this.firstLoopAction = firstLoopAction
    this.variableService = new VariableService()
  }

  private getError(stepOutput: LoopOnItemsStepOutput) {
    const iterations = stepOutput.output?.iterations;
    if (iterations === undefined) {
      throw new Error("Iteration can't be undefined");
    }
    for (const iteration of iterations) {
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
      this.currentAction.settings,
      executionState
    );

    const stepOutput = new LoopOnItemsStepOutput();
    stepOutput.input = await this.variableService.resolve(
      this.currentAction.settings,
      executionState,
      true
    );

    stepOutput.output = {
      index: 1,
      item: undefined,
      iterations: []
    };
    executionState.insertStep(stepOutput, this.currentAction.name, ancestors);
    const loopOutput = stepOutput.output;
    try {
      for (let i = 0; i < resolvedInput.items.length; ++i) {
        ancestors.push([this.currentAction.name, i]);

        loopOutput.index = i + 1;
        loopOutput.item = resolvedInput.items[i];
        loopOutput.iterations.push({});
        this.updateExecutionStateWithLoopDetails(executionState, loopOutput);

        if (this.firstLoopAction === undefined) {
          ancestors.pop();
          continue;
        }

        const executor = new FlowExecutor({
          executionState,
          firstStep: this.firstLoopAction,
          resumeStepMetadata: this.resumeStepMetadata,
        })

        const executionOutput = await executor.execute({ ancestors });

        ancestors.pop();

        if (executionOutput.status === ExecutionOutputStatus.FAILED) {
          stepOutput.status = StepOutputStatus.FAILED
          stepOutput.errorMessage = this.getError(stepOutput)

          return stepOutput
        }

        if (executionOutput.status === ExecutionOutputStatus.PAUSED) {
          stepOutput.status = StepOutputStatus.PAUSED
          stepOutput.pauseMetadata = executionOutput.pauseMetadata

          return stepOutput
        }
      }
      stepOutput.status = StepOutputStatus.SUCCEEDED;
      executionState.insertStep(stepOutput, this.currentAction.name, ancestors);

      return stepOutput
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
    loopOutput: LoopOnItemsStepOutput['output']
  ) {
    executionState.updateLastStep(
      {
        ...loopOutput,
        iterations: undefined
      },
      this.currentAction.name
    );
  }
}
