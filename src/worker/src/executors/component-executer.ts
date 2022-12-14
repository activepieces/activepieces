import { apps } from '@activepieces/components';
import { Component } from '@activepieces/components/dist/src/framework/component';
import { ConfigurationValue } from '@activepieces/components/dist/src/framework/config/configuration-value.model';

export class ComponentExecuter {
    public async exec(componentName: string, actionName: string, config: ConfigurationValue) {
        const component = this.getComponent(componentName);

        return await component.runAction(actionName, config);
    }

    private getComponent(componentName: string): Component {
        const component = apps.find(app => app.name === componentName);

        if (!component) {
            throw new Error(`error=component_not_found component=${componentName}`);
        }

        return component;
    }
}
