import { slackAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { autoAddBot, singleSelectChannelInfo, slackChannel, userId } from '../common/props';
import { tryAddBotToChannel } from '../common/utils';
import { WebClient } from '@slack/web-api';
import { getBotToken, getUserToken, SlackAuthValue } from '../common/auth-helpers';

export const inviteUserToChannelAction = createAction({
	auth: slackAuth,
	name: 'invite-user-to-channel',
	displayName: 'Invite User to Channel',
	description: 'Invites an existing User to an existing channel.',
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		autoAddBot,
		userId: userId(true),
	},
	async run(context) {
		const { channel, autoAddBot: shouldAddBot } = context.propsValue;
		const botToken = getBotToken(context.auth as SlackAuthValue);

		if (shouldAddBot) {
			await tryAddBotToChannel({
				botToken,
				userToken: getUserToken(context.auth as SlackAuthValue),
				channel,
			});
		}

		const client = new WebClient(botToken);
		return await client.conversations.invite({
			channel,
			users: `${context.propsValue.userId}`,
		});
	},
});
