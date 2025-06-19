import { slackAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { WebClient } from '@slack/web-api';

export const setChannelTopicAction = createAction({
	auth: slackAuth,
	name: 'set-channel-topic',
	displayName: 'Set Channel Topic',
	description: 'Sets the topic on a selected channel.',
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
		const client = new WebClient(context.auth.access_token);

		return await client.conversations.setTopic({
			channel,
			topic,
		});
	},
});
