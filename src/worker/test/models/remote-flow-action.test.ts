import {ActionType} from '../../src/model/action/action';
import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutputStatus} from '../../src/model/output/step-output';
import {
  RemoteFlowAction,
  RemoteFlowActionSettings,
} from '../../src/model/action/types/remote-flow-action';
import {FlowExecutor} from '../../src/executors/flow-executor';
import {
  ExecutionOutput,
  ExecutionOutputStatus,
} from '../../src/model/execution/execution-output';
import {ExecutionError} from '../../src/model/execution/execution-error';

let executionState: ExecutionState;

describe('Remote Flow Action', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
  });

  test('Remote flow is executed and output is returned', async () => {
    const remoteFlowAction = new RemoteFlowAction(
      ActionType.REMOTE_FLOW,
      'REMOTE_FLOW_ACTION',
      new RemoteFlowActionSettings({}, 'collectionId', 'flowId')
    );

    jest
      .spyOn(FlowExecutor.prototype, 'executeFlow')
      .mockImplementation(() =>
        Promise.resolve(
          new ExecutionOutput(
            ExecutionOutputStatus.SUCCEEDED,
            executionState,
            10,
            'flow executed!'
          )
        )
      );

    const stepOutput = await remoteFlowAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toEqual('flow executed!');
    expect(stepOutput.errorMessage).toBeUndefined();
  });

  test('Action fails if FlowExecutor throws', async () => {
    const remoteFlowAction = new RemoteFlowAction(
      ActionType.REMOTE_FLOW,
      'REMOTE_FLOW_ACTION',
      new RemoteFlowActionSettings({}, 'collectionId', 'flowId')
    );

    jest
      .spyOn(FlowExecutor.prototype, 'executeFlow')
      .mockRejectedValue(new Error('Error'));

    const stepOutput = await remoteFlowAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toBeUndefined();
    expect(stepOutput.errorMessage).not.toBeUndefined();
  });

  test('Action fails if FlowExecutor fails', async () => {
    const remoteFlowAction = new RemoteFlowAction(
      ActionType.REMOTE_FLOW,
      'REMOTE_FLOW_ACTION',
      new RemoteFlowActionSettings({}, 'collectionId', 'flowId')
    );

    jest
      .spyOn(FlowExecutor.prototype, 'executeFlow')
      .mockImplementation(() =>
        Promise.resolve(
          new ExecutionOutput(
            ExecutionOutputStatus.FAILED,
            executionState,
            10,
            undefined,
            new ExecutionError('action', 'error')
          )
        )
      );

    const stepOutput = await remoteFlowAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toBeUndefined();
    expect(stepOutput.errorMessage).not.toBeUndefined();
  });
});
