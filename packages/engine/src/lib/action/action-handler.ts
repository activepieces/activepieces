import { StepOutput, Action, ExecutionState, ResumeStepMetadata, ExecutionOutput, ExecutionOutputStatus, StepOutputStatus } from '@activepieces/shared';

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

export abstract class BaseActionHandler<CA extends Action = Action, RSM extends ResumeStepMetadata = ResumeStepMetadata> {
  currentAction: CA
  nextAction?: Action
  resumeStepMetadata?: RSM

  protected constructor({ currentAction, nextAction, resumeStepMetadata }: CtorParams<CA, RSM>) {
    this.currentAction = currentAction
    this.nextAction = nextAction
    this.resumeStepMetadata = resumeStepMetadata
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
