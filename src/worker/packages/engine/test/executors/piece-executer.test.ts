import {ConfigurationValue} from "pieces/dist/src/framework/config/configuration-value.model";
import {PieceExecutor} from "../../src/executors/piece-executor";
import {pieces} from "pieces/dist/src/apps";


describe('Component Executor', () => {
  test('Invokes given action', async () => {
    // arrange
    const executer = new PieceExecutor();
    const config: ConfigurationValue = {
        inputs: {},
        authentication: {
            accessToken: 'accessToken',
        },
    };
    jest
        .spyOn(pieces[0], 'runAction')
        .mockReturnValue(Promise.resolve({ success: true }));

    // act
    const result = await executer.exec('slack', 'Send Slack Message', config);

    // assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('throws when component is not found', async () => {
    // arrange
    const executer = new PieceExecutor();
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
        new Error('error=piece_not_found piece_name=NotFoundComponent')
    );
  });
});
