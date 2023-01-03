
import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutputStatus} from '../../src/model/output/step-output';
import {CodeExecutor} from '../../src/executors/code-executer';
import {CodeActionHandler} from "../../src/action/code-action-handler";
import {ActionType, CodeAction} from "shared";


let executionState: ExecutionState;

describe('Code Action', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
  });

  test('Artifact is executed and output is returned', async () => {
    const codeAction: CodeAction = {
      type: ActionType.CODE,
      name: 'CODE_ACTION',
      valid: false,
      displayName: 'CODE_ACTION',
      settings: {
        artifactPackagedId: 'artifact.zip',
        input: {},
        artifactSourceId: 'artifact.zip'
      },
      nextAction: undefined
    }
    const codeActionHandler = new CodeActionHandler(codeAction, undefined);

    jest
      .spyOn(CodeExecutor.prototype, 'executeCode')
      .mockImplementation(() => Promise.resolve('code executed!'));

    const stepOutput = await codeActionHandler.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toEqual('code executed!');
    expect(stepOutput.errorMessage).toBeUndefined();
  });

  test('Action fails if CodeExecutor throws', async () => {
    const codeAction: CodeAction = {
      type: ActionType.CODE,
      name: 'CODE_ACTION',
      valid: false,
      displayName: 'CODE_ACTION',
      settings: {
        artifactPackagedId: 'artifact.zip',
        input: {},
        artifactSourceId: 'artifact.zip'
      },
      nextAction: undefined
    }
    const codeActionHandler = new CodeActionHandler(codeAction, undefined);

    jest
      .spyOn(CodeExecutor.prototype, 'executeCode')
      .mockRejectedValue(new Error('Error'));

    const stepOutput = await codeActionHandler.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toBeUndefined();
    expect(stepOutput.errorMessage).not.toBeUndefined();
  });
});
