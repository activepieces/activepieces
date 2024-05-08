import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { slackChannel, slackInfo } from '../common/props';

import { WebClient } from '@slack/web-api';

export const addRectionToMessageAction = createAction({
	auth: slackAuth,
	name: 'slack-add-reaction-to-message',
	displayName: 'Add Reaction to Message',
	description: 'Add an emoji reaction to a message.',

	props: {
		info: slackInfo,
		channel: slackChannel,
		ts: Property.ShortText({
			displayName: 'Message ts',
			description:
				'Provide the ts (timestamp) value of the message to update, e.g. `1710304378.475129`.',
			required: true,
		}),
		reaction: Property.ShortText({
			displayName: 'Reaction (emoji) name',
			required: true,
			description: 'e.g.`thumbsup`',
		}),
	},

	async run(context) {
		const { channel, ts, reaction } = context.propsValue;

		const slack = new WebClient(context.auth.access_token);

		const response = await slack.reactions.add({
			channel,
			timestamp: ts,
			name: reaction,
		});

		return response;
	},
});
