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
  ErrorCode
} from '@activepieces/shared';
import { createAction } from '../action/action-factory';
import { isNil } from 'lodash';

type FlowExecutorCtor = {
  executionState: ExecutionState;
  resumeStepName?: string;
}

export class FlowExecutor {
  private readonly executionState: ExecutionState;
  private readonly resumeStepName?: string;

  constructor({ executionState, resumeStepName }: FlowExecutorCtor) {
    this.executionState = executionState;
    this.resumeStepName = resumeStepName;
  }

  public async executeFlow(
    flowVersionId: string
  ): Promise<ExecutionOutput> {
    try {
      const startTime = new Date().getTime();

      const flowVersion: FlowVersion = this.prepareFlow(flowVersionId);

      let resumeStep: Action | Trigger | undefined

      if (this.resumeStepName) {
        resumeStep = flowHelper.getStep(flowVersion, this.resumeStepName)

        if (isNil(resumeStep)) {
          throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
              stepName: this.resumeStepName,
            },
          })
        }
      }

      const startStep = resumeStep ?? flowVersion.trigger?.nextAction

      const flowStatus = await this.iterateFlow(
        createAction(startStep),
        []
      );

      const endTime = new Date().getTime();
      const duration = endTime - startTime;

      return this.getExecutionOutput(flowStatus, duration);
    } catch (e) {
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

  private getExecutionOutput(
    flowStatus: ExecutionOutputStatus,
    duration: number
  ): ExecutionOutput {
    if (flowStatus === ExecutionOutputStatus.FAILED) {
      return {
        status: ExecutionOutputStatus.FAILED,
        executionState: this.executionState,
        duration: duration,
        tasks: globals.tasks,
        errorMessage: this.getError()
      };
    }
    else if (flowStatus === ExecutionOutputStatus.PAUSED) {
      return {
        status: ExecutionOutputStatus.PAUSED,
        executionState: this.executionState,
        duration: duration,
        tasks: globals.tasks,
        pauseMetadata: {
          type: PauseType.DELAY,
          resumeStepName: 'step_3',
          executionState: this.executionState,
          resumeDateTime: dayjs().add(10, 'seconds').toISOString(),
        },
      };
    }

    return {
      status: ExecutionOutputStatus.SUCCEEDED,
      executionState: this.executionState,
      duration: duration,
      tasks: globals.tasks,
    };
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
  ): Promise<ExecutionOutputStatus> {
    if (handler === undefined) {
      return ExecutionOutputStatus.SUCCEEDED;
    }

    const startTime = new Date().getTime();

    const output = await handler.execute(this.executionState, ancestors);

    const endTime = new Date().getTime();
    output.duration = endTime - startTime;

    this.executionState.insertStep(output, handler.action.name, ancestors);

    if (output.status === StepOutputStatus.FAILED) {
      return ExecutionOutputStatus.FAILED;
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
