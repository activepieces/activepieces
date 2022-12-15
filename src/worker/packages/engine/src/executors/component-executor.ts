
import {apps} from "components/dist/src/apps";
import {ConfigurationValue} from "components/dist/src/framework/config/configuration-value.model";
import {Component} from "components/dist/src/framework/component";
import {Worker} from "components/dist/src/framework/worker";

export class ComponentExecutor {
    public async exec(componentName: string, actionName: string, config: ConfigurationValue) {
        const component = this.getComponent(componentName);

        let worker = new Worker();
        return await component.runAction(worker, actionName, config);
    }

    private getComponent(componentName: string): Component {
        const component = apps.find(app => app.name === componentName);

        if (!component) {
            throw new Error(`error=component_not_found component=${componentName}`);
        }

        return component;
    }
}
