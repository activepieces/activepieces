import {globals} from '../../src/globals';
import {FlowExecutor} from '../../src/executors/flow-executor';
import {ExecutionState} from '../../src/model/execution/execution-state';
import {Utils} from '../../src/utils';
import {StepOutput} from '../../src/model/output/step-output';
import {ExecutionOutputStatus} from '../../src/model/execution/execution-output';

const rootDir = require('path').resolve('./');

let flowExecutor: FlowExecutor;
let executionState: ExecutionState;

describe('Flow Executor', () => {
  beforeAll(() => {
    jest
      .spyOn(globals, 'collectionDirectory', 'get')
      .mockReturnValue(`${rootDir}/test/resources/collections`);
    jest
      .spyOn(globals, 'flowDirectory', 'get')
      .mockReturnValue(`${rootDir}/test/resources/flows`);
    jest
      .spyOn(globals, 'codeDirectory', 'get')
      .mockReturnValue(`${rootDir}/test/resources/codes`);
    jest
      .spyOn(globals, 'configsFile', 'get')
      .mockReturnValue(`${rootDir}/test/resources/configs.json`);
    jest
      .spyOn(globals, 'triggerPayloadFile', 'get')
      .mockReturnValue(`${rootDir}/test/resources/triggerPayload.json`);
  });

  beforeEach(() => {
    executionState = new ExecutionState();

    const configs = Utils.parseJsonFile(globals.configsFile);
    const triggerPayload = StepOutput.deserialize(
      Utils.parseJsonFile(globals.triggerPayloadFile)
    );

    executionState.insertConfigs(configs);
    executionState.insertStep(triggerPayload, 'trigger', []);

    flowExecutor = new FlowExecutor(executionState);
  });

  test('Flow execution succeeds', async () => {
    const collectionId = 'e1ccfb05-8601-459d-845d-31b449c0ae1a';
    const flowId = 'flow';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.output).toBeUndefined();
    expect(executionOutput.errorMessage).toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(1);
    expect(executionOutput.executionState.steps.size).toEqual(4);
  });

  test('Flow execution fails with invalid collection and flow id', async () => {
    const collectionId = 'invalid-collection';
    const flowId = 'invalid-flow';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.FAILED);
    expect(executionOutput.output).toBeUndefined();
    expect(executionOutput.errorMessage).not.toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(
      1
    );
    expect(executionOutput.executionState.steps.size).toEqual(1);
  });

  test('Flow execution stops and returns output from RESPONSE Action', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-response';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.output).toEqual('done!');
    expect(executionOutput.errorMessage).toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(
      3
    );
    expect(executionOutput.executionState.steps.size).toEqual(3);
  });

  test('Flow execution stops when action fails and returns error', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-error';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.FAILED);
    expect(executionOutput.output).toBeUndefined();
    expect(executionOutput.errorMessage).not.toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(
      2
    );
    expect(executionOutput.executionState.steps.size).toEqual(3);
  });

  test('Flow execution with loop succeeds', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-loops';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.output).toEqual('done with loops!');
    expect(executionOutput.errorMessage).toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(
      2
    );
    expect(executionOutput.executionState.steps.size).toEqual(4);
  });

  test('Flow stops with error in loop and returns error', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-loops-with-error';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.FAILED);
    expect(executionOutput.output).toBeUndefined();
    expect(executionOutput.errorMessage).not.toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(
      2
    );
    expect(executionOutput.executionState.steps.size).toEqual(3);
  });

  test('Flow execution with remote flow succeeds', async () => {
    const collectionId = 'e1ccfb05-8601-459d-845d-31b449c0ae1a';
    const flowId = '8d2a7187-db18-4cb4-8a4f-09ab76a3e9be';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.output).toBeUndefined();
    expect(executionOutput.errorMessage).toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(
      1
    );
    expect(executionOutput.executionState.steps.size).toEqual(3);
  });

  test('Flow stops with error in remote flow and returns error', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-remote-flow-with-error';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.FAILED);
    expect(executionOutput.output).toBeUndefined();
    expect(executionOutput.errorMessage).not.toBeUndefined();

    expect(executionOutput.executionState.configs.size).toEqual(
      2
    );
    expect(executionOutput.executionState.steps.size).toEqual(3);
  });
});
