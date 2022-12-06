import {ActionType} from '../../src/model/action/action';
import {
  CodeAction,
  CodeActionSettings,
} from '../../src/model/action/types/code-action';
import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutputStatus} from '../../src/model/output/step-output';
import {CodeExecutor} from '../../src/executors/code-executer';

let executionState: ExecutionState;

describe('Code Action', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
  });

  test('Artifact is executed and output is returned', async () => {
    const codeAction = new CodeAction(
      ActionType.CODE,
      'CODE_ACTION',
      new CodeActionSettings({}, 'artifact.zip', 'artifact.com')
    );

    jest
      .spyOn(CodeExecutor.prototype, 'executeCode')
      .mockImplementation(() => Promise.resolve('code executed!'));

    const stepOutput = await codeAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toEqual('code executed!');
    expect(stepOutput.errorMessage).toBeUndefined();
  });

  test('Action fails if CodeExecutor throws', async () => {
    const codeAction = new CodeAction(
      ActionType.CODE,
      'CODE_ACTION',
      new CodeActionSettings({}, 'artifact.zip', 'artifact.com')
    );

    jest
      .spyOn(CodeExecutor.prototype, 'executeCode')
      .mockRejectedValue(new Error('Error'));

    const stepOutput = await codeAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toBeUndefined();
    expect(stepOutput.errorMessage).not.toBeUndefined();
  });
});
