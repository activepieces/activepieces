import {slackSendMessageAction} from './actions/send-message-action';
import {createPiece} from "../../framework/piece";
import { slackSendDirectMessageAction } from './actions/send-direct-message-action';

export const slack = createPiece({
	name: 'slack',
	displayName: "Slack",
	logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
	actions: [
    slackSendMessageAction,
    slackSendDirectMessageAction,
  ],
	triggers: []
});
