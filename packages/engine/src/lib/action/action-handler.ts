import { StepOutput, Action, ExecutionState, ResumeStepMetadata, ExecutionOutput, ExecutionOutputStatus, StepOutputStatus, StepOutputForActionType } from '@activepieces/shared';
import { isNil } from '@activepieces/shared'

export type ActionHandler = BaseActionHandler

type HandleFlowExecutorOutput = {
  executionOutput: ExecutionOutput
  stepOutput: StepOutput
}

type CtorParams<CA extends Action, RSM extends ResumeStepMetadata = ResumeStepMetadata> = {
  currentAction: CA
  nextAction?: Action
  resumeStepMetadata?: RSM
}

export type InitStepOutputParams = {
  executionState: ExecutionState
}

type LoadStepOutputParams = {
  executionState: ExecutionState
  ancestors: [string, number][]
}

export abstract class BaseActionHandler<CA extends Action = Action, RSM extends ResumeStepMetadata = ResumeStepMetadata> {
  currentAction: CA
  nextAction?: Action
  resumeStepMetadata?: RSM

  protected constructor({ currentAction, nextAction, resumeStepMetadata }: CtorParams<CA, RSM>) {
    this.currentAction = currentAction
    this.nextAction = nextAction
    this.resumeStepMetadata = resumeStepMetadata
  }

  /**
   * initializes an empty step output
   */
  protected abstract initStepOutput({ executionState }: InitStepOutputParams): Promise<StepOutputForActionType<CA['type']>>

  /**
 * Loads old step output if execution is resuming, else initializes an empty step output
 */
  protected async loadStepOutput({ executionState, ancestors }: LoadStepOutputParams): Promise<StepOutputForActionType<CA['type']>> {
    if (isNil(this.resumeStepMetadata)) {
      return this.initStepOutput({
        executionState,
      })
    }

    const oldStepOutput = executionState.getStepOutput<StepOutputForActionType<CA['type']>>({
      stepName: this.currentAction.name,
      ancestors,
    })

    if (oldStepOutput) {
      oldStepOutput.status = StepOutputStatus.RUNNING
      delete oldStepOutput.pauseMetadata
    }

    return oldStepOutput ?? this.initStepOutput({
      executionState,
    })
  }

  protected handleFlowExecutorOutput({ executionOutput, stepOutput }: HandleFlowExecutorOutput) {
    switch (executionOutput.status) {
      case ExecutionOutputStatus.STOPPED:
        stepOutput.status = StepOutputStatus.STOPPED
        stepOutput.stopResponse = executionOutput.stopResponse
        break

      case ExecutionOutputStatus.PAUSED:
        stepOutput.status = StepOutputStatus.PAUSED
        stepOutput.pauseMetadata = executionOutput.pauseMetadata
        break

      case ExecutionOutputStatus.FAILED:
      case ExecutionOutputStatus.INTERNAL_ERROR:
      case ExecutionOutputStatus.TIMEOUT:
        stepOutput.status = StepOutputStatus.FAILED
        stepOutput.errorMessage = executionOutput.errorMessage
        break

      case ExecutionOutputStatus.RUNNING:
      case ExecutionOutputStatus.SUCCEEDED:
        break
    }
  }

  abstract execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput>;
}
