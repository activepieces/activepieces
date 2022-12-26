import {ExecutionState} from './model/execution/execution-state';
import {FlowExecutor} from './executors/flow-executor';
import {Utils} from './utils';
import {StepOutput} from './model/output/step-output';
import {globals} from './globals';
import {StoreScope} from './model/util/store-scope';
import {ConfigurationValue} from "pieces/dist/src/framework/config/configuration-value.model";

import {ComponentTrigger} from "./model/trigger/types/component-trigger";
import {Trigger} from "pieces/dist/src/framework/trigger/trigger";
import {TriggerStepType} from "./model/trigger/trigger-metadata";
import {FlowVersion} from "./model/flow-version";
import {VariableService} from "./services/variable-service";
import {Context} from "pieces/dist/src/framework/context";
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
                input.flowVersionId,
                new StoreScope([])
            )
            .then(output => {
                Utils.writeToJsonFile(globals.outputFile, output);
            });
    } catch (e) {
        Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
    }
}

async function executeTrigger(): Promise<unknown[]> {
    let optionRequest: { flowVersion: FlowVersion, configs: ConfigurationValue, payload: unknown, webhookUrl: string, method: string} = JSON.parse(args[1]);
    if (optionRequest.flowVersion.trigger === undefined || optionRequest.flowVersion.trigger === null
        || optionRequest.flowVersion.trigger.type !== TriggerStepType.COMPONENT) {
        return [];
    }
    let componentSettings = (optionRequest.flowVersion.trigger as ComponentTrigger).settings;
    let application = pieces.find(f => f.name === componentSettings.componentName);
    if (application === undefined) {
        throw new Error("Component " + componentSettings.componentName + " is not found");
    }
    let trigger = application.getTrigger(componentSettings.triggerName)!;
    let executionState = new ExecutionState();
    executionState.insertConfigs(optionRequest.configs);
    let variableService = new VariableService();
    let context = new Context(optionRequest.payload,
        optionRequest.webhookUrl,
        variableService.resolve(componentSettings.input, executionState));
    switch (optionRequest.method){
        case 'run':
            return trigger.run(context);
        case 'on-enable':
            trigger.onEnable(context);
            return [];
        case 'on-disable':
            trigger.onDisable(context);
            return [];
        default:
            throw new Error("Method " + optionRequest.method + " is not supported");
    }
}

async function validateConfigs() {
    let optionRequest: { componentName: string, triggerName: string, actionName: string, input: Record<string, unknown> } = JSON.parse(args[1]);
    let app: Piece = pieces.find(f => f.name.toLowerCase() === optionRequest.componentName.toLowerCase())!;
    let inputs: Input[] = [];
    if (optionRequest.actionName !== undefined && optionRequest.actionName !== null) {
        let action: Action = app.getAction(optionRequest.actionName)!;
        inputs = action.configs;
    } else {
        let trigger: Trigger = app.getTrigger(optionRequest.triggerName)!;
        inputs = trigger.configs;
    }
    for (let i = 0; i < inputs.length; ++i) {
        if (inputs[i].required && !(inputs[i].name in optionRequest.input)) {
            return false;
        }
    }
    return true;
}

async function getTriggerType() {
    let optionRequest: { pieceName: string, triggerName: string } = JSON.parse(args[1]);
    let app: Piece = pieces.find(f => f.name.toLowerCase() === optionRequest.pieceName.toLowerCase())!;
    let trigger: Trigger = app.getTrigger(optionRequest.triggerName)!;
    return trigger.type;
}

async function execute() {
    switch (args[0]) {
        case 'execute-flow':
            executeFlow();
            break;
        case 'execute-trigger':
            console.log(JSON.stringify(await executeTrigger()));
            break;
        case 'trigger-type':
            console.log(await getTriggerType());
            break;
        case 'validate-configs':
            console.log(await validateConfigs());
            break;
        default:
            break;
    }
}

execute();