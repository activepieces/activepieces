import dayjs from 'dayjs'
import { ActionHandler } from '../action/action-handler'
import {
    ExecutionState,
    StepOutputStatus,
    ExecutionError,
    ExecutionOutputStatus,
    ExecutionOutput,
    ActionType,
    flowHelper,
    ActivepiecesError,
    ErrorCode,
    ResumeStepMetadata,
    Action,
    StepOutput,
    PauseMetadata,
    LoopOnItemsStepOutput,
    BranchStepOutput,
    StopResponse,
    FlowVersion,
} from '@activepieces/shared'
import { createActionHandler } from '../action/action-handler-factory'
import { isNil } from '@activepieces/shared'

type FlowExecutorCtor = {
    executionState: ExecutionState
    firstStep: Action
    flowVersion: FlowVersion
    resumeStepMetadata?: ResumeStepMetadata
}

type GetResumeStepParams = {
    resumeStepMetadata: ResumeStepMetadata
}

type BaseIterateFlowResponse<T extends ExecutionOutputStatus> = {
    status: T
}

type FinishIterateFlowResponse = BaseIterateFlowResponse<
Exclude<
ExecutionOutputStatus,
| ExecutionOutputStatus.PAUSED
| ExecutionOutputStatus.STOPPED
>
>

type PauseIterateFlowResponse = BaseIterateFlowResponse<ExecutionOutputStatus.PAUSED> & {
    pauseMetadata: PauseMetadata
}

type StopIterateFlowResponse = BaseIterateFlowResponse<ExecutionOutputStatus.STOPPED> & {
    stopResponse?: StopResponse
}

type IterateFlowResponse =
  | FinishIterateFlowResponse
  | PauseIterateFlowResponse
  | StopIterateFlowResponse

type GetExecutionOutputParams = {
    iterateFlowResponse: IterateFlowResponse
    duration: number
}

type IterateFlowParams = {
    actionHandler: ActionHandler | undefined
    ancestors: [string, number][]
}

type GeneratePauseMetadata = {
    actionHandler: ActionHandler
    pauseMetadata: PauseMetadata
    stepOutput: StepOutput
}

type ExecuteParams = {
    ancestors: [string, number][]
}

export class FlowExecutor {
    private readonly executionState: ExecutionState
    private readonly firstStep: Action
    private readonly flowVersion: FlowVersion
    private readonly resumeStepMetadata?: ResumeStepMetadata

    constructor({ executionState, firstStep, resumeStepMetadata, flowVersion }: FlowExecutorCtor) {
        this.executionState = executionState
        this.flowVersion = flowVersion
        this.firstStep = firstStep
        this.resumeStepMetadata = resumeStepMetadata
    }

    private getResumeStep({ resumeStepMetadata }: GetResumeStepParams): Action {
        console.debug('[FlowExecutor#getResumeStep] resumeStepMetadata:', resumeStepMetadata)

        const resumeStep = flowHelper.getStepFromSubFlow({
            subFlowStartStep: this.firstStep,
            stepName: resumeStepMetadata.name,
        })

        if (isNil(resumeStep)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName: resumeStepMetadata.name,
                },
            })
        }

        return resumeStep as Action
    }

    private getStartStep() {
        if (isNil(this.resumeStepMetadata)) {
            return this.firstStep
        }

        return this.getResumeStep({
            resumeStepMetadata: this.resumeStepMetadata,
        })
    }

    private generatePauseMetadata(params: GeneratePauseMetadata): PauseMetadata {
        const { actionHandler, pauseMetadata, stepOutput } = params

        switch (actionHandler.currentAction.type) {
            case ActionType.PIECE: {
                if (isNil(pauseMetadata)) {
                    throw new Error('pauseMetadata is undefined, this shouldn\'t happen')
                }

                return pauseMetadata
            }

            case ActionType.BRANCH: {
                const { output } = stepOutput as BranchStepOutput

                if (isNil(output) || isNil(pauseMetadata)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.PAUSE_METADATA_MISSING,
                        params: {},
                    })
                }

                return {
                    ...pauseMetadata,
                    resumeStepMetadata: {
                        type: ActionType.BRANCH,
                        conditionEvaluation: output.condition,
                        name: actionHandler.currentAction.name,
                        childResumeStepMetadata: pauseMetadata.resumeStepMetadata,
                    },
                }
            }

            case ActionType.LOOP_ON_ITEMS: {
                const { output } = stepOutput as LoopOnItemsStepOutput

                if (isNil(output) || isNil(pauseMetadata)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.PAUSE_METADATA_MISSING,
                        params: {},
                    })
                }

                return {
                    ...pauseMetadata,
                    resumeStepMetadata: {
                        type: ActionType.LOOP_ON_ITEMS,
                        iteration: output.index,
                        name: actionHandler.currentAction.name,
                        childResumeStepMetadata: pauseMetadata.resumeStepMetadata,
                    },
                }
            }

            case ActionType.CODE:
                throw new Error('missing action, this shouldn\'t happen')
        }
    }

    /**
   * execute flow without catching errors, used to run sub flows like branches and loops
   * @param ancestors holds previous iterations output for loop steps
   * @returns execution output
   */
    public async execute({ ancestors }: ExecuteParams): Promise<ExecutionOutput> {
        const startTime = dayjs()

        const startStep = this.getStartStep()

        const startActionHandler = createActionHandler({
            action: startStep,
            resumeStepMetadata: this.resumeStepMetadata,
        })

        const iterateFlowResponse = await this.iterateFlow({
            actionHandler: startActionHandler,
            ancestors,
        })

        const endTime = dayjs()
        const duration = endTime.diff(startTime)

        return this.getExecutionOutput({
            iterateFlowResponse,
            duration,
        })
    }

    /**
   * execute flow catching errors used to run the main flow
   */
    public async safeExecute(): Promise<ExecutionOutput> {
        try {
            return await this.execute({
                ancestors: [],
            })
        }
        catch (e) {
            console.error(e)

            return {
                status: ExecutionOutputStatus.FAILED,
                executionState: this.executionState,
                duration: 0,
                tags: this.executionState.tags,
                tasks: this.executionState.taskCount,
                errorMessage: {
                    stepName: 'Flow Execution',
                    errorMessage: (e as Error).message,
                },
            }
        }
    }

    private getExecutionOutput(params: GetExecutionOutputParams): ExecutionOutput {
        const { iterateFlowResponse, duration } = params

        const baseExecutionOutput = {
            executionState: this.executionState,
            duration,
            tags: this.executionState.tags,
            tasks: this.executionState.taskCount,
        }

        switch (iterateFlowResponse.status) {
            case ExecutionOutputStatus.SUCCEEDED:
                return {
                    status: ExecutionOutputStatus.SUCCEEDED,
                    ...baseExecutionOutput,
                }

            case ExecutionOutputStatus.STOPPED:
                return {
                    status: ExecutionOutputStatus.STOPPED,
                    stopResponse: iterateFlowResponse.stopResponse,
                    ...baseExecutionOutput,
                }

            case ExecutionOutputStatus.PAUSED:
                return {
                    status: ExecutionOutputStatus.PAUSED,
                    pauseMetadata: iterateFlowResponse.pauseMetadata,
                    ...baseExecutionOutput,
                }

            case ExecutionOutputStatus.FAILED:
            case ExecutionOutputStatus.RUNNING:
            case ExecutionOutputStatus.TIMEOUT:
            case ExecutionOutputStatus.QUOTA_EXCEEDED:
            case ExecutionOutputStatus.INTERNAL_ERROR:
                return {
                    status: iterateFlowResponse.status,
                    errorMessage: this.getError(),
                    ...baseExecutionOutput,
                }
        }
    }

    private getError(): ExecutionError | undefined {
        for (const [key, value] of Object.entries(this.executionState.steps)) {
            if (value.status === StepOutputStatus.FAILED) {
                return {
                    stepName: key,
                    errorMessage: value.errorMessage as string,
                }
            }
        }

        return undefined
    }

    private async iterateFlow(params: IterateFlowParams): Promise<IterateFlowResponse> {
        const { actionHandler, ancestors } = params

        if (isNil(actionHandler)) {
            return {
                status: ExecutionOutputStatus.SUCCEEDED,
            }
        }

        const startTime = dayjs()

        const actionHandlerOutput = await actionHandler.execute({
            flowVersion: this.flowVersion,
        }, this.executionState, ancestors)

        const endTime = dayjs()

        const duration = endTime.diff(startTime)

        actionHandlerOutput.stepOutput.duration = actionHandlerOutput.stepOutput.duration
            ? actionHandlerOutput.stepOutput.duration + duration
            : duration

        this.executionState.insertStep(actionHandlerOutput.stepOutput, actionHandler.currentAction.name, ancestors)
        switch (actionHandlerOutput.executionOutputStatus) {
            case ExecutionOutputStatus.PAUSED: {
                const pauseMetadata = this.generatePauseMetadata({
                    actionHandler,
                    pauseMetadata: actionHandlerOutput.pauseMetadata!,
                    stepOutput: actionHandlerOutput.stepOutput,
                })

                return {
                    status: ExecutionOutputStatus.PAUSED,
                    pauseMetadata,
                }
            }

            case ExecutionOutputStatus.STOPPED: {
                return {
                    status: ExecutionOutputStatus.STOPPED,
                    stopResponse: actionHandlerOutput.stopResponse!,
                }
            }

            case ExecutionOutputStatus.FAILED: {
                return {
                    status: ExecutionOutputStatus.FAILED,
                }
            }

            case ExecutionOutputStatus.RUNNING: {
                throw new Error('this shouldn\'t happen')
            }

            case ExecutionOutputStatus.TIMEOUT:
            case ExecutionOutputStatus.SUCCEEDED:
            case ExecutionOutputStatus.QUOTA_EXCEEDED:
            case ExecutionOutputStatus.INTERNAL_ERROR:
                break
        }

        const nextActionHandler = createActionHandler({
            action: actionHandler.nextAction,
        })

        return await this.iterateFlow({
            actionHandler: nextActionHandler,
            ancestors,
        })
    }
}
