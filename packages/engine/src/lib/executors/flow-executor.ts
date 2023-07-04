import dayjs from 'dayjs';
import { globals } from '../globals';
import { ActionHandler } from '../action/action-handler';
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
} from '@activepieces/shared';
import { createActionHandler } from '../action/action-handler-factory';
import { isNil } from '@activepieces/shared'

type FlowExecutorCtor = {
  executionState: ExecutionState
  firstStep: Action
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
  stepOutput: StepOutput
}

type ExecuteParams = {
  ancestors: [string, number][]
}

export class FlowExecutor {
  private readonly executionState: ExecutionState
  private readonly firstStep: Action
  private readonly resumeStepMetadata?: ResumeStepMetadata

  constructor({ executionState, firstStep, resumeStepMetadata }: FlowExecutorCtor) {
    this.executionState = executionState
    this.firstStep = firstStep
    this.resumeStepMetadata = resumeStepMetadata
  }

  private getResumeStep({ resumeStepMetadata }: GetResumeStepParams) {
    console.debug('[FlowExecutor#getResumeStep] resumeStepMetadata:', resumeStepMetadata);

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

    return resumeStep
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
    const { actionHandler, stepOutput } = params

    switch(actionHandler.currentAction.type) {
      case ActionType.PIECE: {
        if (isNil(stepOutput.pauseMetadata)) {
          throw new Error('pauseMetadata is undefined, this shouldn\'t happen')
        }

        return stepOutput.pauseMetadata
      }

      case ActionType.BRANCH: {
        const { output } = stepOutput as BranchStepOutput

        if (isNil(output) || isNil(stepOutput.pauseMetadata)) {
          throw new ActivepiecesError({
            code: ErrorCode.PAUSE_METADATA_MISSING,
            params: {}
          })
        }

        return {
          ...stepOutput.pauseMetadata,
          resumeStepMetadata: {
            type: ActionType.BRANCH,
            conditionEvaluation: output.condition,
            name: actionHandler.currentAction.name,
            childResumeStepMetadata: stepOutput.pauseMetadata.resumeStepMetadata,
          }
        }
      }

      case ActionType.LOOP_ON_ITEMS: {
        const { output } = stepOutput as LoopOnItemsStepOutput

        if (isNil(output) || isNil(stepOutput.pauseMetadata)) {
          throw new ActivepiecesError({
            code: ErrorCode.PAUSE_METADATA_MISSING,
            params: {}
          })
        }

        return {
          ...stepOutput.pauseMetadata,
          resumeStepMetadata: {
            type: ActionType.LOOP_ON_ITEMS,
            iteration: output.index,
            name: actionHandler.currentAction.name,
            childResumeStepMetadata: stepOutput.pauseMetadata.resumeStepMetadata,
          }
        }
      }

      case ActionType.CODE:
      case ActionType.MISSING:
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
      ancestors: ancestors,
    })

    const endTime = dayjs()
    const duration = endTime.diff(startTime)

    return this.getExecutionOutput({
      iterateFlowResponse,
      duration
    });
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
        tasks: this.executionState.taskCount,
        errorMessage: {
          stepName: 'Flow Execution',
          errorMessage: (e as Error).message
        }
      }
    }
  }

  private getExecutionOutput(params: GetExecutionOutputParams): ExecutionOutput {
    const { iterateFlowResponse, duration } = params

    const baseExecutionOutput = {
      executionState: this.executionState,
      duration: duration,
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
          errorMessage: value.errorMessage as string
        };
      }
    }

    return undefined;
  }

  private async iterateFlow(params: IterateFlowParams) : Promise<IterateFlowResponse> {
    const { actionHandler, ancestors } = params

    if (isNil(actionHandler)) {
      return {
        status: ExecutionOutputStatus.SUCCEEDED
      }
    }

    const startTime = dayjs()

    const stepOutput = await actionHandler.execute(this.executionState, ancestors);

    const endTime = dayjs()

    const duration = endTime.diff(startTime)

    stepOutput.duration = stepOutput.duration
      ? stepOutput.duration + duration
      : duration

    this.executionState.insertStep(stepOutput, actionHandler.currentAction.name, ancestors)

    switch (stepOutput.status) {
      case StepOutputStatus.PAUSED: {
        const pauseMetadata = this.generatePauseMetadata({
          actionHandler,
          stepOutput,
        })

        return {
          status: ExecutionOutputStatus.PAUSED,
          pauseMetadata,
        }
      }

      case StepOutputStatus.STOPPED: {
        return {
          status: ExecutionOutputStatus.STOPPED,
          stopResponse: stepOutput.stopResponse,
        }
      }

      case StepOutputStatus.FAILED: {
        return {
          status: ExecutionOutputStatus.FAILED
        }
      }

      case StepOutputStatus.RUNNING: {
        throw new Error('this shouldn\'t happen')
      }

      case StepOutputStatus.SUCCEEDED:
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
