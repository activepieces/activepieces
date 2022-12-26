import {slackSendMessageAction} from './actions/send-message-action';
import {createComponent} from "../../framework/piece";

export const slack = createComponent({
	name: 'slack',
	displayName: "Slack",
	logoUrl: 'https://cdn.activepieces.com/components/slack/logo.png',
	actions: [slackSendMessageAction],
	triggers: [],
});
