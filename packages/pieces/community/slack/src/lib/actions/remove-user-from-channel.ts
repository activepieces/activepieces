import { slackAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel, userId } from '../common/props';
import { WebClient } from '@slack/web-api';

export const removeUserFromChannelAction = createAction({
	auth: slackAuth,
	name: 'remove-user-from-channel',
	displayName: 'Remove User from Channel',
	description: 'Removes a specified user from a specified channel.',
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		userId,
	},
	async run(context) {
		const { channel, userId } = context.propsValue;

		if (!userId) {
			throw new Error('Please provide user ID.');
		}

		const client = new WebClient(context.auth.access_token);

		return await client.conversations.kick({
			channel,
			user: userId,
		});
	},
});
