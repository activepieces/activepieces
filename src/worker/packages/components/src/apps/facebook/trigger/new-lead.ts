import {ConfigurationValue} from "../../../framework/config/configuration-value.model";
import {createTrigger} from "../../../framework/trigger/trigger";
import {TriggerType} from "../../../framework/trigger/trigger-type";

export const newFacebookLead = createTrigger({
	name: 'New Lead',
	description: 'Trigger when new facebook lead',
	configs: [],
	type: TriggerType.POLLING,
	async onEnable(){},
	async onDisable(){},
	async run(configValue: ConfigurationValue) {
		// TODO IMPLEMENT THE TRIGGER
		return [{
			lead: '#12312'
		}];
	},
});
