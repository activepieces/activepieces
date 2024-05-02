import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { slackChannel, slackInfo } from '../common/props';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';

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

		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: 'https://slack.com/api/reactions.add',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			body: {
				channel,
				timestamp: ts,
				name: reaction,
			},
		};

		const response = await httpClient.sendRequest(request);

		return response.body;
	},
});
