import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { processMessageTimestamp } from '../common/utils';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const getMessageAction = createAction({
	name: 'get-message',
	displayName: 'Get Message by Timestamp',
	description: `Retrieves a specific message from a channel history using the message's timestamp.`,
	audience: 'both',
	aiMetadata: { description: "Fetch a single message from a channel by its exact timestamp; read-only and repeatable. Use this when you already have the message ts and channel; use Get channel history to read a range of messages or Search messages to find one by content.", idempotent: true },
	auth: slackAuth,
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
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
		const client = new WebClient(getBotToken(auth as SlackAuthValue));

		return await client.conversations.history({
			channel: propsValue.channel,
			oldest: messageTimestamp,
			limit: 1,
			inclusive: true,
		});
	},
});
