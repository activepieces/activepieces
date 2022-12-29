import {slackSendMessageAction} from './actions/send-message-action';
import {createPiece} from "../../framework/piece";

export const slack = createPiece({
	name: 'slack',
	displayName: "Slack",
	logoUrl: 'https://cdn.activepieces.com/components/slack.png',
	actions: [slackSendMessageAction],
	triggers: [],
});
