import {globals} from '../../src/globals';
import {FlowExecutor} from '../../src/executors/flow-executor';
import {ExecutionState} from '../../src/model/execution/execution-state';
import {Utils} from '../../src/utils';
import {StepOutput} from '../../src/model/output/step-output';
import {ExecutionOutputStatus} from '../../src/model/execution/execution-output';
import {LoopOnItemsStepOutput} from "../../src/model/output/loop-on-items-step-output";

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
        .spyOn(globals, 'inputFile', 'get')
        .mockReturnValue(`${rootDir}/test/resources/input.json`);
    jest
      .spyOn(globals, 'executorFile', 'get')
      .mockReturnValue(`${rootDir}/test/resources/executor.js`);
  });

  beforeEach(() => {
    executionState = new ExecutionState();


    const input = Utils.parseJsonFile(globals.inputFile);
    const triggerPayload = StepOutput.deserialize(input.triggerPayload);

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

    console.log(JSON.stringify(executionOutput));
    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.errorMessage).toBeUndefined();

    expect(executionOutput.executionState.steps['CODE_ACTION_1']?.input).toEqual({
      trigger: {
        name: "zaina",
        items: ["one", "two"]
      }
    });
    expect(executionOutput.executionState.steps['CODE_ACTION_2']?.input).toEqual({
      project_token: null
    });
    expect(Object.keys(executionOutput.executionState.configs).length).toEqual(1);
    expect(Object.keys(executionOutput.executionState.steps).length).toEqual(4);
  });

  // We also need to replace axios with axios .default, otherwise after webpack axios will be broken
/*  test('Flow execution with storage flow succeeded', async () => {
    const input: {
      flowVersionId: string;
      collectionVersionId: string;
      workerToken: string;
      apiUrl: string;
    } = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken;
    globals.apiUrl = input.apiUrl;

    const collectionId = 'storage';
    const flowId = 'storage';

    const configs = Utils.parseJsonFile(globals.configsFile);
    const executionOutput = await flowExecutor.executeFlow(
        collectionId,
        flowId,
        new StoreScope([]),
        configs
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.executionState.steps['PUT_STORAGE']?.output).toEqual({
      value: "value"
    });
      expect(executionOutput.executionState.steps['GET_STORAGE']?.output).toEqual({
        value: "value"
      });
    expect(Object.keys(executionOutput.executionState.configs).length).toEqual(
        1
    );
    expect(Object.keys(executionOutput.executionState.steps).length).toEqual(3);
  });*/

  test('Flow execution stops when action fails and returns error', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-error';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.FAILED);
    expect(executionOutput.errorMessage).not.toBeUndefined();

    expect(Object.keys(executionOutput.executionState.configs).length).toEqual(
        1
    );
    expect(Object.keys(executionOutput.executionState.steps).length).toEqual(3);
  });

  test('Flow execution and merge iterations result in last step', async () => {
    const collectionId = 'c75e61bf-5673-4cb7-a87d-ff9b3eddad84';
    const flowId = 'nested-loop-merge-iterations';

    const executionOutput = await flowExecutor.executeFlow(
        collectionId,
        flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.errorMessage).toBeUndefined();
    expect(executionOutput.executionState.steps['merge_step']!.output.output).toEqual({
      response: 'hello'
    });
  });

  test('Nested loop with inner item that refer to first loop', async () => {
    const collectionId = '969c13de-a4a4-43c1-9710-18a19fbd4176';
    const flowId = 'nested-loop-with-code-refer-to-first-loop';

    const executionOutput = await flowExecutor.executeFlow(
        collectionId,
        flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.errorMessage).toBeUndefined();

    // We should make sure the inner code cannot resolve iterations object in the loop,
    // otherwise two loops time complexity
    // of n^2 will become n^4 because of logs printing.
    // This should be resolved without any iterations array.
    expect(executionOutput.executionState.steps['FIRST_LOOP'].output!.iterations[0]['SECOND_LOOP'].output.iterations[1]['INNER_CODE']?.input).toEqual({
      x: {
        item: 'hello 1',
        index: 1
      }
    });
  });


  test('Flow execution with loop succeeds', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-loops';

    const executionOutput = await flowExecutor.executeFlow(
        collectionId,
        flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.SUCCEEDED);
    expect(executionOutput.errorMessage).toBeUndefined();

    expect(Object.keys(executionOutput.executionState.configs).length).toEqual(
        1
    );
    const loopOutput: LoopOnItemsStepOutput = executionOutput.executionState.steps['LOOP_ACTION']! as LoopOnItemsStepOutput;
    expect(loopOutput.output!.iterations[1]['CODE_IN_LOOP']?.input).toEqual({
      item: 'two',
      index: 2
    });
    expect(loopOutput.output!.iterations[0]['CODE_IN_LOOP']?.input).toEqual({
      item: "one",
      index: 1
    });
    const innerLoop: LoopOnItemsStepOutput = loopOutput.output!.iterations[0]['LOOP_IN_LOOP']! as LoopOnItemsStepOutput;
    expect(innerLoop.output!.iterations[1]["CODE_IN_LOOP_IN_LOOP"]?.input).toEqual({
      loop: {
        item: "two",
        index: 2
      }
    });
    expect(Object.keys(executionOutput.executionState.steps).length).toEqual(3);
  });

  test('Flow stops with error in loop and returns error', async () => {
    const collectionId = '9e95cfbb-6ed3-4554-8060-d7180225d73c';
    const flowId = 'flow-with-loops-with-error';

    const executionOutput = await flowExecutor.executeFlow(
      collectionId,
      flowId
    );

    expect(executionOutput.status).toEqual(ExecutionOutputStatus.FAILED);
    expect(executionOutput.errorMessage).not.toBeUndefined();


    expect(Object.keys(executionOutput.executionState.configs).length).toEqual(
      1
    );
    expect(Object.keys(executionOutput.executionState.steps).length).toEqual(3);
  });

});
