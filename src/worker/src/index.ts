import {ExecutionState} from './model/execution/execution-state';
import {FlowExecutor} from './executors/flow-executor';
import {Utils} from './utils';
import {StepOutput} from './model/output/step-output';
import {globals} from './globals';
import {StoreScope} from './model/util/store-scope';
import {slack} from "./components/apps/slack";
import {ConfigurationValue} from "./components/framework/config/configuration-value.model";
import {Component} from "./components/framework/component";
import {InputOption} from "./components/framework/config/input-option.model";

function executeFlow() {
    try {
        const input: {
            flowVersionId: string;
            collectionVersionId: string;
            workerToken: string;
            apiUrl: string;
        } = Utils.parseJsonFile(globals.inputFile);

        globals.workerToken = input.workerToken;
        globals.apiUrl = input.apiUrl;
        const executionState = new ExecutionState();
        const configs = Utils.parseJsonFile(globals.configsFile);
        const triggerPayload: StepOutput = StepOutput.deserialize(
            Utils.parseJsonFile(globals.triggerPayloadFile)
        );

        executionState.insertStep(triggerPayload, 'trigger', []);

        const executor = new FlowExecutor(executionState);

        executor
            .executeFlow(
                input.collectionVersionId,
                input.flowVersionId,
                new StoreScope([]),
                configs
            )
            .then(output => {
                Utils.writeToJsonFile(globals.outputFile, output);
            });
    } catch (e) {
        Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
    }
}

const apps = [slack];
const args = process.argv.slice(2);

function printMetadata() {
    console.log(JSON.stringify(apps.map(f => f.metadata())));
}

async function printOptions() {
    let optionRequest: { componentName: string, actionName: string, configName: string, config: ConfigurationValue } = JSON.parse(args[1]);
    let app: Component = apps.find(f => f.name.toLowerCase() === optionRequest.componentName.toLowerCase())!;
    let inputOptions: InputOption[] = await app.runConfigOptions(optionRequest.actionName, optionRequest.configName, optionRequest.config);
    console.log(JSON.stringify(inputOptions));
}

async function execute() {
    switch (args[0]) {
        case 'execute-flow':
            executeFlow();
            break;
        case 'components':
            printMetadata();
            break;
        case 'options':
            await printOptions()
            break;
        default:
            break;
    }
}

execute();
