import { StepOutput, Action, ExecutionState, ResumeStepMetadata, ExecutionOutput, ExecutionOutputStatus, StepOutputStatus, StepOutputForActionType, FlowVersion, StopResponse, PauseMetadata } from '@activepieces/shared'
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

export type ExecuteActionOutput = {
    stepOutput: StepOutput
    pauseMetadata: PauseMetadata | undefined
    stopResponse: StopResponse | undefined
    executionOutputStatus: ExecutionOutputStatus
}

export type ExecuteContext = {
    flowVersion: FlowVersion
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
        }

        return oldStepOutput ?? this.initStepOutput({
            executionState,
        })
    }

    protected convertExecutionStatusToStepStatus(status: StepOutputStatus): ExecutionOutputStatus {
        switch (status) {
            case StepOutputStatus.SUCCEEDED:
                return ExecutionOutputStatus.SUCCEEDED
            case StepOutputStatus.FAILED:
                return ExecutionOutputStatus.FAILED
            case StepOutputStatus.RUNNING:
                return ExecutionOutputStatus.RUNNING
            case StepOutputStatus.PAUSED:
                return ExecutionOutputStatus.PAUSED
            case StepOutputStatus.STOPPED:
                return ExecutionOutputStatus.STOPPED
        }
    }


    protected convertToStopResponse(executionOutput: ExecutionOutput): StopResponse | undefined {
        if (executionOutput.status === ExecutionOutputStatus.STOPPED) {
            return executionOutput.stopResponse
        }
        return undefined
    }

    protected convertToPauseMetadata(executionOutput: ExecutionOutput): PauseMetadata | undefined {
        if (executionOutput.status === ExecutionOutputStatus.PAUSED) {
            return executionOutput.pauseMetadata
        }
        return undefined
    }

    protected handleFlowExecutorOutput({ executionOutput, stepOutput }: HandleFlowExecutorOutput): void {
        switch (executionOutput.status) {
            case ExecutionOutputStatus.STOPPED:
                stepOutput.status = StepOutputStatus.STOPPED
                break

            case ExecutionOutputStatus.PAUSED:
                stepOutput.status = StepOutputStatus.PAUSED
                break

            case ExecutionOutputStatus.FAILED:
            case ExecutionOutputStatus.INTERNAL_ERROR:
            case ExecutionOutputStatus.TIMEOUT:
            case ExecutionOutputStatus.QUOTA_EXCEEDED:
                stepOutput.status = StepOutputStatus.FAILED
                stepOutput.errorMessage = executionOutput.errorMessage
                break

            case ExecutionOutputStatus.RUNNING:
            case ExecutionOutputStatus.SUCCEEDED:
                break
        }
    }

    abstract execute(
        context: ExecuteContext,
        executionState: ExecutionState,
        ancestors: [string, number][]
    ): Promise<ExecuteActionOutput>
}
