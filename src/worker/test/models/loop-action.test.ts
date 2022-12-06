import {ActionType} from '../../src/model/action/action';
import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutputStatus} from '../../src/model/output/step-output';
import {FlowExecutor} from '../../src/executors/flow-executor';
import {
  LoopOnItemAction,
  LoopOnItemActionSettings,
} from '../../src/model/action/types/loop-action';
import {
  CodeAction,
  CodeActionSettings,
} from '../../src/model/action/types/code-action';

let executionState: ExecutionState;

describe('Loop Action', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
  });

  test('Loop action is executed', async () => {
    const loopAction = new LoopOnItemAction(
      ActionType.LOOP_ON_ITEMS,
      'LOOP_ON_ITEMS_ACTION',
      new LoopOnItemActionSettings([1, 2]),
      new CodeAction(
        ActionType.CODE,
        'CODE_ACTION',
        new CodeActionSettings({}, 'artifact.zip', 'artifact.com')
      )
    );

    jest
      .spyOn(FlowExecutor.prototype, 'iterateFlow')
      .mockImplementation(() => Promise.resolve(true));

    const stepOutput = await loopAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toBeUndefined();
    expect(stepOutput.errorMessage).toBeUndefined();
  });

  test('Loop action is fails on error and stops', async () => {
    const loopAction = new LoopOnItemAction(
      ActionType.LOOP_ON_ITEMS,
      'LOOP_ON_ITEMS_ACTION',
      new LoopOnItemActionSettings([1, 2]),
      new CodeAction(
        ActionType.CODE,
        'CODE_ACTION',
        new CodeActionSettings({}, 'artifact.zip', 'artifact.com')
      )
    );

    jest
      .spyOn(FlowExecutor.prototype, 'iterateFlow')
      .mockImplementation(() => Promise.resolve(false));

    const stepOutput = await loopAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toBeUndefined();
  });
});
