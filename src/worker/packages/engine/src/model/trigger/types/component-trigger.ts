import {TriggerMetadata, TriggerStepType} from "../trigger-metadata";
import {ActionMetadata} from "../../action/action-metadata";

export class ComponentTriggerSettings {
    input: any;
    componentName: string;
    triggerName: string;

    constructor(input: any, componentName: string, triggerName: string) {
        this.validate(input, componentName, triggerName);
        this.input = input;
        this.componentName = componentName;
        this.triggerName = triggerName;
    }

    validate(input: any, componentName: string, triggerName: string) {
        if (!input) {
            throw Error('Settings "input" attribute is undefined.');
        }
        if (!componentName) {
            throw Error('Settings "componentName" attribute is undefined.');
        }
        if (!triggerName) {
            throw Error('Settings "triggerName" attribute is undefined.');
        }
    }

    static deserialize(jsonData: any): ComponentTriggerSettings {
        return new ComponentTriggerSettings(
            jsonData['input'],
            jsonData['componentName'],
            jsonData['triggerName']
        );
    }
}

export class ComponentTrigger extends TriggerMetadata {
    settings: ComponentTriggerSettings;

    constructor(
        settings: ComponentTriggerSettings,
        type: TriggerStepType,
        nextAction?: ActionMetadata
    ) {
        super(type, nextAction);
        this.settings = settings;
    }

}
