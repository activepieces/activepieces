import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { autoAddBot, singleSelectChannelInfo, slackChannel } from '../common/props';
import { tryAddBotToChannel } from '../common/utils';
import { WebClient } from '@slack/web-api';
import { getBotToken, getUserToken, SlackAuthValue } from '../common/auth-helpers';

export const setChannelTopicAction = createAction({
	auth: slackAuth,
	name: 'set-channel-topic',
	displayName: 'Set Channel Topic',
	description: 'Sets the topic on a selected channel.',
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		autoAddBot,
		topic: Property.LongText({
			displayName: 'Topic',
			required: true,
		}),
	},
	async run(context) {
		const { channel, topic, autoAddBot: shouldAddBot } = context.propsValue;
		const botToken = getBotToken(context.auth as SlackAuthValue);

		if (shouldAddBot) {
			await tryAddBotToChannel({
				botToken,
				userToken: getUserToken(context.auth as SlackAuthValue),
				channel,
			});
		}

		const client = new WebClient(botToken);
		return await client.conversations.setTopic({ channel, topic });
	},
});
