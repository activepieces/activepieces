import { slackAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel, userId } from '../common/props';
import { WebClient } from '@slack/web-api';

export const inviteUserToChannelAction = createAction({
	auth: slackAuth,
	name: 'invite-user-to-channel',
	displayName: 'Invite User to Channel',
	description: 'Invites an existing User to an existing channel.',
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		userId,
	},
	async run(context) {
		const client = new WebClient(context.auth.access_token);

		return await client.conversations.invite({
			channel: context.propsValue.channel,
			users: `${context.propsValue.userId}`,
		});
	},
});
