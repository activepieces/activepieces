import { apps } from '@activepieces/components';
import { ConfigurationValue } from '@activepieces/components/dist/src/framework/config/configuration-value.model';
import { ComponentExecuter } from '../../src/executors/component-executer';

describe('Component Executor', () => {
  test('Invokes given action', async () => {
    // arrange
    const executer = new ComponentExecuter();
    const config: ConfigurationValue = {
        inputs: {},
        authentication: {
            accessToken: 'accessToken',
        },
    };
    jest
        .spyOn(apps[0], 'runAction')
        .mockReturnValue(Promise.resolve({ success: true }));

    // act
    const result = await executer.exec('Slack', 'Send Slack Message', config);

    // assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('throws when component is not found', async () => {
    // arrange
    const executer = new ComponentExecuter();
    const config: ConfigurationValue = {
        inputs: {},
        authentication: {
            accessToken: 'accessToken',
        },
    };

    // act
    const result = executer.exec('NotFoundComponent', 'actionName', config);

    // assert
    await expect(result).rejects.toThrow(
        new Error('error=component_not_found component=NotFoundComponent')
    );
  });
});
