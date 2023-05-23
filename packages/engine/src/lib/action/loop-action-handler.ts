import { FlowExecutor } from '../executors/flow-executor';
import { VariableService } from '../services/variable-service';
import { Action, ActionType, ExecutionOutputStatus, ExecutionState, LoopOnItemsAction, LoopResumeStepMetadata } from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { LoopOnItemsStepOutput, StepOutputStatus, StepOutput } from '@activepieces/shared';
import { isNil } from 'lodash';

type CtorParams = {
  currentAction: LoopOnItemsAction
  firstLoopAction?: Action,
  nextAction?: Action
  resumeStepMetadata?: LoopResumeStepMetadata
}

type InitStepOutputParams = {
  executionState: ExecutionState
}

type LoadStepOutputParams = {
  executionState: ExecutionState
  ancestors: [string, number][]
}

export class LoopOnItemActionHandler extends BaseActionHandler<LoopOnItemsAction, LoopResumeStepMetadata> {
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

  private iterationIsResuming(i: number) {
    return this.resumeStepMetadata?.iteration === i + 1
  }

  private iterationIsNotResuming(i: number) {
    return !this.iterationIsResuming(i)
  }

  /**
   * initializes an empty step output
   */
  private async initStepOutput({ executionState }: InitStepOutputParams): Promise<LoopOnItemsStepOutput> {
    const censoredInput = await this.variableService.resolve({
      unresolvedInput: this.currentAction.settings,
      executionState,
      censorConnections: true,
    })

    const newStepOutput: LoopOnItemsStepOutput = {
      type: ActionType.LOOP_ON_ITEMS,
      status: StepOutputStatus.RUNNING,
      input: censoredInput,
    }

    newStepOutput.output = {
      index: 1,
      item: undefined,
      iterations: []
    }

    return newStepOutput
  }

  /**
   * Loads old step output if execution is resuming, else initializes an empty step output
   */
  private async loadStepOutput({ executionState, ancestors }: LoadStepOutputParams): Promise<LoopOnItemsStepOutput> {
    if (isNil(this.resumeStepMetadata)) {
      return this.initStepOutput({
        executionState,
      })
    }

    const oldStepOutput = executionState.getStepOutput<LoopOnItemsStepOutput>({
      stepName: this.currentAction.name,
      ancestors,
    })

    return oldStepOutput ?? this.initStepOutput({
      executionState,
    })
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const resolvedInput = await this.variableService.resolve({
      unresolvedInput: this.currentAction.settings,
      executionState,
      censorConnections: false,
    })

    const stepOutput = await this.loadStepOutput({
      executionState,
      ancestors,
    })

    executionState.insertStep(stepOutput, this.currentAction.name, ancestors);
    const loopOutput = stepOutput.output!
    try {
      for (let i = loopOutput.index - 1; i < resolvedInput.items.length; ++i) {
        ancestors.push([this.currentAction.name, i]);

        if (this.iterationIsNotResuming(i)) {
          loopOutput.iterations.push({})
        }

        loopOutput.index = i + 1;
        loopOutput.item = resolvedInput.items[i];
        this.updateExecutionStateWithLoopDetails(executionState, loopOutput);

        if (this.firstLoopAction === undefined) {
          ancestors.pop();
          continue;
        }

        const executor = new FlowExecutor({
          executionState,
          firstStep: this.firstLoopAction,
          resumeStepMetadata: this.iterationIsResuming(i)
            ? this.resumeStepMetadata?.childResumeStepMetadata
            : undefined,
        })

        const executionOutput = await executor.execute({ ancestors })

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

      stepOutput.status = StepOutputStatus.SUCCEEDED
      executionState.insertStep(stepOutput, this.currentAction.name, ancestors)

      return stepOutput
    }
    catch (e) {
      console.error(e)

      stepOutput.errorMessage = (e as Error).message
      stepOutput.status = StepOutputStatus.FAILED

      return Promise.resolve(stepOutput)
    }
  }


  /**
   * We should remove iterations during the inner calls, to avoid huge overhead for logs.
   * Example if there are two nested loop contains code that reference to the first loop.
   * The iteration object will always contain all previous iterations.
   */
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
