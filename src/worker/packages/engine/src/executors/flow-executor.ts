import {ExecutionState} from '../model/execution/execution-state';
import {StepOutputStatus} from '../model/output/step-output';
import {ExecutionError} from '../model/execution/execution-error';
import {
    ExecutionOutput,
    ExecutionOutputStatus,
} from '../model/execution/execution-output';
import {Utils} from '../utils';
import {globals} from '../globals';
import {ActionHandler} from "../action/action-handler";
import {CollectionVersion, FlowVersion} from "shared";
import {createAction} from "../action/action-factory";

export class FlowExecutor {
    private readonly executionState: ExecutionState;

    constructor(executionState: ExecutionState) {
        this.executionState = executionState;
    }

    public async executeFlow(
        collectionId: string,
        flowId: string
    ) {
        try {
            const startTime = new Date().getTime();

            const flowVersion: FlowVersion = this.prepareFlow(
                collectionId,
                flowId
            );
            const flowStatus = await this.iterateFlow(
                createAction(flowVersion.trigger?.nextAction),
                []
            );

            const endTime = new Date().getTime();
            const duration = endTime - startTime;

            return this.getExecutionOutput( flowStatus, duration);
        } catch (e) {
            console.error(e);
            return new ExecutionOutput(
                ExecutionOutputStatus.FAILED,
                this.executionState,
                0,
                new ExecutionError('Flow Execution', (e as Error).message)
            );
        }
    }

    private getExecutionOutput(
        flowStatus: boolean,
        duration: number
    ) {
        if (!flowStatus) {
            return new ExecutionOutput(
                ExecutionOutputStatus.FAILED,
                this.executionState,
                duration,
                this.getError()
            );
        }
        return new ExecutionOutput(
            ExecutionOutputStatus.SUCCEEDED,
            this.executionState,
            duration,
            undefined
        );
    }

    private getError() {
        for (const [key, value] of Object.entries(this.executionState.steps)) {
            if (value.status === StepOutputStatus.FAILED) {
                return new ExecutionError(key, value.errorMessage);
            }
        }

        return undefined;
    }

    public async iterateFlow(
        handler: ActionHandler | undefined,
        ancestors: [string, number][]
    ): Promise<boolean> {
        if (handler === undefined) {
            return true;
        }

        const startTime = new Date().getTime();

        const output = await handler.execute(
            this.executionState,
            ancestors
        );

        const endTime = new Date().getTime();
        output.duration = endTime - startTime;

        this.executionState.insertStep(output, handler.action.name, ancestors);

        if (output.status === StepOutputStatus.FAILED) {
            return false;
        }

        return await this.iterateFlow(handler.nextAction, ancestors);
    }

    private prepareFlow(
        collectionId: string,
        flowId: string
    ) {
        try {
            // Parse all required files.
            const collectionVersion: CollectionVersion = Utils.parseJsonFile(`${globals.collectionDirectory}/${collectionId}.json`)
            const flowVersion: FlowVersion = Utils.parseJsonFile(`${globals.flowDirectory}/${flowId}.json`)

            let configs = new Map(
                collectionVersion.configs.map(config => {
                    return [config.key, config.value];
                })
            );
            // Add predefined configs to Execution State.
            this.executionState.insertConfigs(configs);

            return flowVersion;
        } catch (e) {
            throw Error((e as Error).message);
        }
    }
}
