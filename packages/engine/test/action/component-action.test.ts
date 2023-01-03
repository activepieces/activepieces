import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutputStatus} from '../../src/model/output/step-output';
import {ConfigurationValue} from "pieces/dist/src/framework/config/configuration-value.model";
import {ActionType, PieceAction, PieceActionSettings} from "shared";
import {PieceActionHandler} from "../../src/action/piece-action-handler";
import {PieceExecutor} from "../../src/executors/piece-executor";


describe('Component Action', () => {
    test('Sets step output on success', async () => {
        // arrange
        const config: ConfigurationValue = {
            inputs: {},
            authentication: {
                accessToken: 'accessToken',
            },
        };

        const settings: PieceActionSettings = {
            pieceName: 'pieceName',
            actionName: 'actionName',
            input: config
        };

        const action: PieceAction = {
            type: ActionType.PIECE,
            name: 'actionName',
            displayName: 'actionName',
            settings: settings,
            valid: false,
            nextAction: undefined
        };

        const actionHandler = new PieceActionHandler(action, undefined);
        jest
            .spyOn(PieceExecutor.prototype, 'exec')
            .mockResolvedValue({success: true});

        const stepOutput = await actionHandler.execute(new ExecutionState(), []);

        expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
        expect(stepOutput.output).toEqual({success: true});
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

        const settings: PieceActionSettings = {
            pieceName: 'pieceName',
            actionName: 'actionName',
            input: config
        };

        const action: PieceAction = {
            type: ActionType.PIECE,
            name: 'actionName',
            displayName: 'actionName',
            settings: settings,
            valid: false,
            nextAction: undefined
        };

        const actionHandler = new PieceActionHandler(action, undefined);
        jest
            .spyOn(PieceExecutor.prototype, 'exec')
            .mockRejectedValue(new Error('component execution failure'));

        const stepOutput = await actionHandler.execute(new ExecutionState(), []);

        expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
        expect(stepOutput.output).toBeUndefined();
        expect(stepOutput.errorMessage).toBe('component execution failure');
    });
});
