import {ExecutionState} from './model/execution/execution-state';
import {FlowExecutor} from './executors/flow-executor';
import {Utils} from './utils';
import {StepOutput} from './model/output/step-output';
import {globals} from './globals';
import {Trigger} from "pieces/dist/src/framework/trigger/trigger";
import {Action} from "pieces/dist/src/framework/action/action";
import {Input} from "pieces/dist/src/framework/config/input.model";
import {pieces} from "pieces/dist/src/apps";
import {Piece} from "pieces/dist/src/framework/piece";


const args = process.argv.slice(2);


function executeFlow() {
    try {
        const input: {
            flowVersionId: string;
            collectionVersionId: string;
            workerToken: string;
            apiUrl: string;
            triggerPayload: StepOutput
        } = Utils.parseJsonFile(globals.inputFile);

        globals.workerToken = input.workerToken;
        globals.apiUrl = input.apiUrl;

        const executionState = new ExecutionState();
        executionState.insertStep(input.triggerPayload, 'trigger', []);
        const executor = new FlowExecutor(executionState);
        executor
            .executeFlow(
                input.collectionVersionId,
                input.flowVersionId
            )
            .then(output => {
                Utils.writeToJsonFile(globals.outputFile, output);
            });
    } catch (e) {
        Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
    }
}


async function execute() {
    switch (args[0]) {
        case 'execute-flow':
            executeFlow();
            break;
        default:
            break;
    }
}

execute();