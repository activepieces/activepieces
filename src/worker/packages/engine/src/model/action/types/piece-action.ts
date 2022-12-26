import {VariableService} from "../../../services/variable-service";
import {ExecutionState} from "../../execution/execution-state";
import {StepOutput, StepOutputStatus} from "../../output/step-output";
import {StoreScope} from "../../util/store-scope";
import {ActionMetadata, ActionType} from "../action-metadata";
import {PieceExecutor} from "../../../executors/piece-executor";

export class PieceActionSettings {
    pieceName: string;
    actionName: string;
    input: Record<string, any>;

    constructor(pieceName: string, actionName: string, input: Record<string, any>) {
        this.validate(pieceName, actionName);
        this.pieceName = pieceName;
        this.actionName = actionName;
        this.input = input;
    }

    private validate(pieceName: string, actionName: string) {
        if (!pieceName) {
            throw Error('Settings "pieceName" attribute is undefined.');
        }

        if (!actionName) {
            throw Error('Settings "actionName" attribute is undefined.');
        }
    }

    static deserialize(jsonData: any): PieceActionSettings {
        return new PieceActionSettings(
            jsonData['pieceName'],
            jsonData['actionName'],
            jsonData['input'],
        );
    }
}

export class PieceAction extends ActionMetadata {
    variableService: VariableService;
    settings: PieceActionSettings;

    constructor(
        type: ActionType,
        name: string,
        settings: PieceActionSettings,
        nextAction?: ActionMetadata
    ) {
        super(type, name, nextAction);
        this.settings = settings;
        this.variableService = new VariableService();
    }

    async execute(
        executionState: ExecutionState,
        _ancestors: [string, number][],
        _storeScope: StoreScope
    ): Promise<StepOutput> {
        const stepOutput = new StepOutput();

        const config = this.variableService.resolve(
            this.settings.input,
            executionState
        );

        stepOutput.input = config;

        try {
            const executer = new PieceExecutor();

            stepOutput.output = await executer.exec(
                this.settings.pieceName,
                this.settings.actionName,
                config
            );

            stepOutput.status = StepOutputStatus.SUCCEEDED;
            return stepOutput;
        } catch (e) {
            stepOutput.errorMessage = (e as Error).message;
            stepOutput.status = StepOutputStatus.FAILED;
            return stepOutput;
        }
    }
}
