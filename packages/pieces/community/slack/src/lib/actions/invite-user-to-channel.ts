import { slackAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel, userId } from '../common/props';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const inviteUserToChannelAction = createAction({
	auth: slackAuth,
	name: 'invite-user-to-channel',
	displayName: 'Invite User to Channel',
	description: 'Invites an existing User to an existing channel.',
	audience: 'both',
	aiMetadata: { description: 'Add an existing workspace user to an existing channel as a member. Both the channel and the user must already exist. Effectively idempotent in result since a user already in the channel stays a member, though Slack returns an error if they are already present.', idempotent: false },
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		userId: userId(true),
	},
	async run(context) {
		const client = new WebClient(getBotToken(context.auth as SlackAuthValue));

		return await client.conversations.invite({
			channel: context.propsValue.channel,
			users: `${context.propsValue.userId}`,
		});
	},
});
