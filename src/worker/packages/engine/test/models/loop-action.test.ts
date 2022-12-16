import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../src/model/output/step-output';
import {FlowExecutor} from '../../src/executors/flow-executor';
import {
  LoopOnItemAction,
  LoopOnItemActionSettings,
} from '../../src/model/action/types/loop-action';
import {
  CodeAction,
  CodeActionSettings,
} from '../../src/model/action/types/code-action';
import {StoreScope} from "../../src/model/util/store-scope";
import {ActionType} from "../../src/model/action/action-metadata";

let executionState: ExecutionState;

describe('Loop Action', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
    executionState.insertStep({
      output: {
        items: ["one", "two"]
      }
    }, 'trigger', []);

  });

  test('Loop action is executed', async () => {
    const loopAction = new LoopOnItemAction(
      ActionType.LOOP_ON_ITEMS,
      'LOOP_ON_ITEMS_ACTION',
      new LoopOnItemActionSettings("${trigger.items}"),
      new CodeAction(
        ActionType.CODE,
        'CODE_ACTION',
        new CodeActionSettings({}, 'artifact.zip')
      )
    );

    jest
      .spyOn(FlowExecutor.prototype, 'iterateFlow')
      .mockImplementation(() => Promise.resolve(true));

    const stepOutput = await loopAction.execute(executionState, [], new StoreScope([]));

    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toEqual({
      current_item: "two",
      current_iteration: 2,
      iterations: [
        {},
        {}
      ]
    });
    expect(stepOutput.errorMessage).toBeUndefined();
  });

  test('Loop action is fails on error and stops', async () => {
    const loopAction = new LoopOnItemAction(
      ActionType.LOOP_ON_ITEMS,
      'LOOP_ON_ITEMS_ACTION',
      new LoopOnItemActionSettings("${trigger.items}"),
      new CodeAction(
        ActionType.CODE,
        'CODE_ACTION',
        new CodeActionSettings({}, 'artifact.zip')
      )
    );

    jest
      .spyOn(FlowExecutor.prototype, 'iterateFlow')
      .mockImplementation(() => Promise.resolve(false));


    const stepOutput = await loopAction.execute(executionState, [], new StoreScope([]));

    expect(stepOutput.input).toEqual({
      items: ["one", "two"]
    })
    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toEqual({
      current_item: "one",
      current_iteration: 1,
      iterations: [
        {}
      ]
    });
  });
});
