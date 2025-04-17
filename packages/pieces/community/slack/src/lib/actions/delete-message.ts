import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../..';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { processMessageTimestamp } from '../common/utils';
import { WebClient } from '@slack/web-api';

export const deleteMessageAction = createAction({
	name: 'delete-message',
	displayName: 'Delete message',
	description: 'Deletes an existing message in a specific channel.',
	auth: slackAuth,
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		ts: Property.ShortText({
			displayName: 'Message Timestamp',
			description:
				'Please provide the timestamp of the message you wish to delete, such as `1710304378.475129`. Alternatively, you can easily obtain the message link by clicking on the three dots next to the message and selecting the `Copy link` option.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const messageTimestamp = processMessageTimestamp(propsValue.ts);
		if (!messageTimestamp) {
			throw new Error('Invalid Timestamp Value.');
		}
		const client = new WebClient(auth.access_token);

		return await client.chat.delete({
			channel: propsValue.channel,
			ts: messageTimestamp,
		});
	},
});
