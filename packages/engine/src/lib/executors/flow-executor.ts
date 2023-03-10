import { Utils } from '../utils';
import { globals } from '../globals';
import { ActionHandler } from '../action/action-handler';
import {
  ExecutionState,
  FlowVersion,
  StepOutputStatus,
  ExecutionError,
  ExecutionOutputStatus,
  ExecutionOutput
} from '@activepieces/shared';
import { createAction } from '../action/action-factory';

export class FlowExecutor {
  private readonly executionState: ExecutionState;

  constructor(executionState: ExecutionState) {
    this.executionState = executionState;
  }

  public async executeFlow(
    flowVersionId: string
  ): Promise<ExecutionOutput> {
    try {
      const startTime = new Date().getTime();

      const flowVersion: FlowVersion = this.prepareFlow( flowVersionId);
      const flowStatus = await this.iterateFlow(
        createAction(flowVersion.trigger?.nextAction),
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
        errorMessage: {
          stepName: 'Flow Execution',
          errorMessage: (e as Error).message
        }
      };
    }
  }

  private getExecutionOutput(
    flowStatus: boolean,
    duration: number
  ): ExecutionOutput {
    if (!flowStatus) {
      return {
        status: ExecutionOutputStatus.FAILED,
        executionState: this.executionState,
        duration: duration,
        errorMessage: this.getError()
      };
    }
    return {
      status: ExecutionOutputStatus.SUCCEEDED,
      executionState: this.executionState,
      duration: duration,
      errorMessage: undefined
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
  ): Promise<boolean> {
    if (handler === undefined) {
      return true;
    }

    const startTime = new Date().getTime();

    const output = await handler.execute(this.executionState, ancestors);

    const endTime = new Date().getTime();
    output.duration = endTime - startTime;

    this.executionState.insertStep(output, handler.action.name, ancestors);

    if (output.status === StepOutputStatus.FAILED) {
      return false;
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
