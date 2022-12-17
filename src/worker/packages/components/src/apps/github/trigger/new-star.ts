import {ConfigurationValue} from "../../../framework/config/configuration-value.model";
import {createTrigger} from "../../../framework/trigger/trigger";
import {TriggerType} from "../../../framework/trigger/trigger-type";
import {Context} from "../../../framework/context";

export const newGithubStar = createTrigger({
    name: 'New Star',
    description: 'Trigger when new someone starred repository',
    configs: [],
    type: TriggerType.WEBHOOK,
    async onEnable(context: Context) {
    },
    async onDisable(context: Context) {
    },
    async run(context: Context) {
        return [context.payload];
    },
});
