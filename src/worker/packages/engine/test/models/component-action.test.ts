import { ComponentExecutor } from '../../src/executors/component-executor';
import { ComponentAction, ComponentActionSettings } from '../../src/model/action/types/component-action';
import { ExecutionState } from '../../src/model/execution/execution-state';
import { StepOutputStatus } from '../../src/model/output/step-output';
import { StoreScope } from '../../src/model/util/store-scope';
import {ConfigurationValue} from "components/dist/src/framework/config/configuration-value.model";
import {ActionType} from "../../src/model/action/action-metadata";


describe('Component Action', () => {
  test('Sets step output on success', async () => {
    // arrange
    const config: ConfigurationValue = {
        inputs: {},
        authentication: {
            accessToken: 'accessToken',
        },
    };

    const settings = new ComponentActionSettings(
        'componentName',
        'actionName',
        config,
    );

    const action = new ComponentAction(
        ActionType.COMPONENT,
        'actionName',
        settings,
    );

    jest
      .spyOn(ComponentExecutor.prototype, 'exec')
      .mockResolvedValue({ success: true });

    const stepOutput = await action.execute(new ExecutionState(), [], new StoreScope([]));

    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toEqual({ success: true });
    expect(stepOutput.errorMessage).toBeUndefined();
  });

  test('Sets step error on failure', async () => {
    // arrange
    const config: ConfigurationValue = {
        inputs: {},
        authentication: {
            accessToken: 'accessToken',
        },
    };

    const settings = new ComponentActionSettings(
        'componentName',
        'actionName',
        config,
    );

    const action = new ComponentAction(
        ActionType.COMPONENT,
        'actionName',
        settings,
    );

    jest
      .spyOn(ComponentExecutor.prototype, 'exec')
      .mockRejectedValue(new Error('component execution failure'));

    const stepOutput = await action.execute(new ExecutionState(), [], new StoreScope([]));

    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toBeUndefined();
    expect(stepOutput.errorMessage).toBe('component execution failure');
  });
});
