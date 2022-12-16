import {ExecutionState} from './model/execution/execution-state';
import {FlowExecutor} from './executors/flow-executor';
import {Utils} from './utils';
import {StepOutput} from './model/output/step-output';
import {globals} from './globals';
import {StoreScope} from './model/util/store-scope';
import {Component} from "components/dist/src/framework/component";
import {ConfigurationValue} from "components/dist/src/framework/config/configuration-value.model";

import {InputOption} from "components/dist/src/framework/config/input-option.model";
import {ComponentTrigger, ComponentTriggerSettings} from "./model/trigger/types/component-trigger";
import {Trigger} from "components/dist/src/framework/trigger/trigger";
import {TriggerMetadata, TriggerStepType} from "./model/trigger/trigger-metadata";
import {FlowVersion} from "./model/flow-version";
import {VariableService} from "./services/variable-service";
import {apps} from "components/dist/src/apps";


const args = process.argv.slice(2);


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
        const configs = Utils.parseJsonFile(globals.configsFile);
        const triggerPayload: StepOutput = StepOutput.deserialize(
            Utils.parseJsonFile(globals.triggerPayloadFile)
        );

        const executionState = new ExecutionState();
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

async function executeTrigger(): Promise<unknown[]> {
    let optionRequest: { flowVersion: FlowVersion, configs: ConfigurationValue } = JSON.parse(args[1]);
    if (optionRequest.flowVersion.trigger === undefined || optionRequest.flowVersion.trigger === null
        || optionRequest.flowVersion.trigger.type !== TriggerStepType.COMPONENT) {
        return [];
    }
    let componentSettings = (optionRequest.flowVersion.trigger as ComponentTrigger).settings;
    let application = apps.find(f => f.name === componentSettings.componentName);
    if (application === undefined) {
        throw new Error("Component " + componentSettings.componentName + " is not found");
    }
    let trigger = application.getTrigger(componentSettings.componentName);
    let executionState = new ExecutionState();
    executionState.insertConfigs(optionRequest.configs);
    let variableService = new VariableService();
    return trigger.run(variableService.resolve(componentSettings.input, executionState));
}

function getMetadata() {
    return apps.map(f => f.metadata());
}

async function getTriggerType() {
    let optionRequest: { componentName: string, triggerName: string } = JSON.parse(args[1]);
    let app: Component = apps.find(f => f.name.toLowerCase() === optionRequest.componentName.toLowerCase())!;
    let trigger: Trigger = app.getTrigger(optionRequest.triggerName);
    return trigger.type;
}

async function getOptions() {
    let optionRequest: { componentName: string, actionName: string, configName: string, config: ConfigurationValue } = JSON.parse(args[1]);
    let app: Component = apps.find(f => f.name.toLowerCase() === optionRequest.componentName.toLowerCase())!;
    let inputOptions: InputOption[] = await app.runConfigOptions(optionRequest.actionName, optionRequest.configName, optionRequest.config);
    return inputOptions;
}

async function execute() {
    switch (args[0]) {
        case 'execute-flow':
            executeFlow();
            break;
        case 'execute-trigger':
            console.log(JSON.stringify(await executeTrigger()));
            break;
        case 'components':
            console.log(JSON.stringify(getMetadata()));
            break;
        case 'options':
            console.log(JSON.stringify(await getOptions()));
            break;
        case 'trigger-type':
            console.log(JSON.stringify(await getTriggerType()));
            break;
        default:
            break;
    }
}

execute();
