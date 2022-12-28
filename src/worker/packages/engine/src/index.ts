import {FlowExecutor} from './executors/flow-executor';
import {Utils} from './utils';
import {globals} from './globals';
import { StepOutput } from 'shared/dist/instance-run/execution/step-output';
import { ExecutionState } from 'shared';


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