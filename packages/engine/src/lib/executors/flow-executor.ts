import dayjs from 'dayjs';
import { Utils } from '../utils';
import { globals } from '../globals';
import { ActionHandler } from '../action/action-handler';
import {
  ExecutionState,
  FlowVersion,
  StepOutputStatus,
  ExecutionError,
  ExecutionOutputStatus,
  ExecutionOutput,
  ActionType,
  PauseType,
  flowHelper,
  Action,
  Trigger,
  ActivepiecesError,
  ErrorCode,
  FlowVersionId,
  ResumeStepMetadata
} from '@activepieces/shared';
import { createAction } from '../action/action-factory';
import { isNil } from 'lodash';

type FlowExecutorCtor = {
  executionState: ExecutionState;
  resumeStepMetadata?: ResumeStepMetadata;
}

type GetResumeStepParams = {
  flowVersion: FlowVersion
  resumeStepMetadata: ResumeStepMetadata
}

type GetFirstStepParams = {
  flowVersion: FlowVersion
}

type GetStartStepParams = {
  flowVersionId: FlowVersionId
}

type BaseIterateFlowResponse<T extends ExecutionOutputStatus> = {
  status: T
}

type FinishIterateFlowResponse = BaseIterateFlowResponse<Exclude<ExecutionOutputStatus, ExecutionOutputStatus.PAUSED>>

type PauseIterateFlowResponse = BaseIterateFlowResponse<ExecutionOutputStatus.PAUSED> & {
  resumeStepName: string
}

type IterateFlowResponse = FinishIterateFlowResponse | PauseIterateFlowResponse

type GetExecutionOutputParams = {
  iterateFlowResponse: IterateFlowResponse
  duration: number
}

export class FlowExecutor {
  private readonly executionState: ExecutionState;
  private readonly resumeStepMetadata?: ResumeStepMetadata;

  constructor({ executionState, resumeStepMetadata }: FlowExecutorCtor) {
    this.executionState = executionState;
    this.resumeStepMetadata = resumeStepMetadata;
  }

  private getResumeStep({ flowVersion, resumeStepMetadata}: GetResumeStepParams) {
    const resumeStep = flowHelper.getStep(flowVersion, resumeStepMetadata.name)

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

  private getFirstStep({ flowVersion }: GetFirstStepParams) {
    return flowVersion.trigger?.nextAction
  }

  private getStartStep({ flowVersionId }: GetStartStepParams) {
    const flowVersion = this.prepareFlow(flowVersionId)

    if (this.resumeStepMetadata) {
      return this.getResumeStep({
        flowVersion,
        resumeStepMetadata: this.resumeStepMetadata,
      })
    }

    return this.getFirstStep({
      flowVersion,
    })
  }

  public async executeFlow(
    flowVersionId: string
  ): Promise<ExecutionOutput> {
    try {
      const startTime = new Date().getTime();

      const startStep = this.getStartStep({
        flowVersionId,
      })

      const iterateFlowResponse = await this.iterateFlow(
        createAction(startStep),
        []
      );

      const endTime = new Date().getTime();
      const duration = endTime - startTime;

      return this.getExecutionOutput({
        iterateFlowResponse,
        duration
      });
    }
    catch (e) {
      console.error(e);

      return {
        status: ExecutionOutputStatus.FAILED,
        executionState: this.executionState,
        duration: 0,
        tasks: globals.tasks,
        errorMessage: {
          stepName: 'Flow Execution',
          errorMessage: (e as Error).message
        }
      };
    }
  }

  private getExecutionOutput(params: GetExecutionOutputParams): ExecutionOutput {
    const { iterateFlowResponse, duration } = params

    const baseExecutionOutput = {
      executionState: this.executionState,
      duration: duration,
      tasks: globals.tasks,
    }

    switch (iterateFlowResponse.status) {
      case ExecutionOutputStatus.SUCCEEDED:
        return {
          status: ExecutionOutputStatus.SUCCEEDED,
          ...baseExecutionOutput,
        }

      case ExecutionOutputStatus.PAUSED:
        return {
          status: ExecutionOutputStatus.PAUSED,
          pauseMetadata: {
            type: PauseType.DELAY,
            executionState: this.executionState,
            resumeStepMetadata: {
              type: ActionType.PIECE,
              name: iterateFlowResponse.resumeStepName,
            },
            resumeDateTime: dayjs().add(20, 'seconds').toISOString(),
          },
          ...baseExecutionOutput,
        }

      default:
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

  public async iterateFlow(
    handler: ActionHandler | undefined,
    ancestors: [string, number][]
  ): Promise<IterateFlowResponse> {
    if (handler === undefined) {
      return {
        status: ExecutionOutputStatus.SUCCEEDED
      }
    }

    if (handler.action.type === ActionType.PIECE && handler.action.settings.pieceName === 'delay') {
      if (isNil(handler.nextAction)) {
        return {
          status: ExecutionOutputStatus.SUCCEEDED
        }
      }

      return {
        status: ExecutionOutputStatus.PAUSED,
        resumeStepName: handler.nextAction.action.name
      }
    }

    const startTime = new Date().getTime();

    const output = await handler.execute(this.executionState, ancestors);

    const endTime = new Date().getTime();
    output.duration = endTime - startTime;

    this.executionState.insertStep(output, handler.action.name, ancestors);

    if (output.status === StepOutputStatus.FAILED) {
      return {
        status: ExecutionOutputStatus.FAILED
      }
    }

    return await this.iterateFlow(handler.nextAction, ancestors);
  }

  private prepareFlow(flowVersionId: string) {
    try {
      // Parse all required files.
      const flowVersion: FlowVersion = Utils.parseJsonFile(
        `${globals.flowDirectory}/${flowVersionId}.json`
      );

      globals.flowId = flowVersion.id;

      return flowVersion;
    } catch (e) {
      throw Error((e as Error).message);
    }
  }
}
