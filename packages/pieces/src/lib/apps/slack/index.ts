import {slackSendMessageAction} from './actions/send-message-action';
import {createPiece} from "../../framework/piece";

export const slack = createPiece({
	name: 'slack',
	displayName: "Slack",
	logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
	actions: [slackSendMessageAction],
	triggers: [],
	description:"Connect to Slack and integrate it into your flow"
});
