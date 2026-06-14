import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const setChannelTopicAction = createAction({
	auth: slackAuth,
	name: 'set-channel-topic',
	displayName: 'Set Channel Topic',
	description: 'Sets the topic on a selected channel.',
	audience: 'both',
	aiMetadata: { description: 'Set (overwrite) the topic of a selected channel. Idempotent: re-running with the same topic leaves the channel in the same state. The bot must be a member of the channel.', idempotent: true },
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		topic: Property.LongText({
			displayName: 'Topic',
			required: true,
		}),
	},
	async run(context) {
		const { channel, topic } = context.propsValue;
		const client = new WebClient(getBotToken(context.auth as SlackAuthValue));

		return await client.conversations.setTopic({
			channel,
			topic,
		});
	},
});
