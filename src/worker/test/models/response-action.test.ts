import {ActionType} from '../../src/model/action/action';
import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutputStatus} from '../../src/model/output/step-output';
import {
  ResponseAction,
  ResponseActionSettings,
} from '../../src/model/action/types/response-action';

let executionState: ExecutionState;

describe('Response Action', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
  });

  test('Response action returns output', async () => {
    const responseAction = new ResponseAction(
      ActionType.RESPONSE,
      'RESPONSE_ACTION',
      new ResponseActionSettings('done!')
    );

    const stepOutput = await responseAction.execute(executionState, []);

    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toEqual('done!');
    expect(stepOutput.errorMessage).toBeUndefined();
  });
});
