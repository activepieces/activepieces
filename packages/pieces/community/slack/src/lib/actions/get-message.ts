import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { autoAddBot, singleSelectChannelInfo, slackChannel } from '../common/props';
import { processMessageTimestamp, tryAddBotToChannel } from '../common/utils';
import { WebClient } from '@slack/web-api';
import { getBotToken, getUserToken, SlackAuthValue } from '../common/auth-helpers';

export const getMessageAction = createAction({
	name: 'get-message',
	displayName: 'Get Message by Timestamp',
	description: `Retrieves a specific message from a channel history using the message's timestamp.`,
	auth: slackAuth,
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		autoAddBot,
		ts: Property.ShortText({
			displayName: 'Message Timestamp',
			description:
				'Please provide the timestamp of the message you wish to retrieve, such as `1710304378.475129`. Alternatively, you can easily obtain the message link by clicking on the three dots next to the message and selecting the `Copy link` option.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const messageTimestamp = processMessageTimestamp(propsValue.ts);
		if (!messageTimestamp) {
			throw new Error('Invalid Timestamp Value.');
		}

		const botToken = getBotToken(auth as SlackAuthValue);

		if (propsValue.autoAddBot) {
			await tryAddBotToChannel({
				botToken,
				userToken: getUserToken(auth as SlackAuthValue),
				channel: propsValue.channel,
			});
		}

		const client = new WebClient(botToken);
		return await client.conversations.history({
			channel: propsValue.channel,
			oldest: messageTimestamp,
			limit: 1,
			inclusive: true,
		});
	},
});
