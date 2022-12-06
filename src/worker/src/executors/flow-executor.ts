import {ExecutionState} from '../model/execution/execution-state';
import {FlowVersion} from '../model/flow-version';
import {Action, ActionType} from '../model/action/action';
import {CollectionVersion} from '../model/collection-version';
import {StepOutputStatus} from '../model/output/step-output';
import {ExecutionError} from '../model/execution/execution-error';
import {
  ExecutionOutput,
  ExecutionOutputStatus,
} from '../model/execution/execution-output';
import {Utils} from '../utils';
import {globals} from '../globals';

export class FlowExecutor {
  private readonly executionState: ExecutionState;

  constructor(executionState: ExecutionState) {
    this.executionState = executionState;
  }

  public async executeFlow(collectionId: string, flowId: string) {
    try {
      const startTime = new Date().getTime();

      const flowVersion: FlowVersion = this.prepareFlow(collectionId, flowId);
      const flowStatus = await this.iterateFlow(
        flowVersion.trigger?.nextAction,
        []
      );

      const endTime = new Date().getTime();
      const duration = endTime - startTime;

      return this.getExecutionOutput(flowVersion, flowStatus, duration);
    } catch (e) {
      return new ExecutionOutput(
        ExecutionOutputStatus.FAILED,
        this.executionState,
        0,
        undefined,
        new ExecutionError('Flow Execution', (e as Error).message)
      );
    }
  }

  private getExecutionOutput(
    flowVersion: FlowVersion,
    flowStatus: boolean,
    duration: number
  ) {
    if (!flowStatus) {
      return new ExecutionOutput(
        ExecutionOutputStatus.FAILED,
        this.executionState,
        duration,
        undefined,
        this.getError()
      );
    }
    return new ExecutionOutput(
      ExecutionOutputStatus.SUCCEEDED,
      this.executionState,
      duration,
      this.getOutput(flowVersion),
      undefined
    );
  }

  private getError() {
    for (const [key, value] of this.executionState.steps) {
      if (value.status === StepOutputStatus.FAILED) {
        return new ExecutionError(key, value.errorMessage);
      }
    }

    return undefined;
  }

  private getOutput(flowVersion: FlowVersion) {
    let action: Action | undefined = flowVersion.trigger?.nextAction;
    while (action !== undefined) {
      if (action.type === ActionType.RESPONSE) {
        return this.executionState.steps.get(action.name)!.output;
      }
      action = action.nextAction;
    }
    return undefined;
  }

  public async iterateFlow(
    action: Action | undefined,
    ancestors: [string, number][]
  ): Promise<boolean> {
    if (action === undefined) {
      return true;
    }

    const startTime = new Date().getTime();

    const output = await action.execute(this.executionState, ancestors);

    const endTime = new Date().getTime();
    output.duration = endTime - startTime;

    this.executionState.insertStep(output, action.name, ancestors);

    if (output.status === StepOutputStatus.FAILED) {
      return false;
    }

    if (action.type === ActionType.RESPONSE) {
      return true;
    }

    return await this.iterateFlow(action.nextAction, ancestors);
  }

  private prepareFlow(collectionId: string, flowId: string) {
    try {
      // Parse all required files.
      const collectionVersion: CollectionVersion =
        CollectionVersion.deserialize(
          Utils.parseJsonFile(
            `${globals.collectionDirectory}/${collectionId}.json`
          )
        );
      const flowVersion: FlowVersion = FlowVersion.deserialize(
        Utils.parseJsonFile(`${globals.flowDirectory}/${flowId}.json`)
      );

      // Add predefined configs to Execution State.
      this.executionState.insertConfigs(collectionVersion.getConfigsMap());
      this.executionState.insertConfigs(flowVersion.getConfigsMap());

      return flowVersion;
    } catch (e) {
      throw Error((e as Error).message);
    }
  }
}
