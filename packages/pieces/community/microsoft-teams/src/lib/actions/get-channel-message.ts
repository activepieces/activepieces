import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, withGraphRetry } from '../common/graph';

export const getChannelMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_channel_message',
	displayName: 'Get Channel Message',
	description: 'Fetch a specific channel message by team, channel, and message ID (optionally a reply).',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
		messageId: Property.ShortText({
			displayName: 'Message ID',
			required: true,
			description: 'The ID of the channel message to retrieve.',
		}),
		replyId: Property.ShortText({
			displayName: 'Reply ID (optional)',
			required: false,
			description: 'Provide to fetch a specific reply under the message.',
		}),
	},
	async run(context) {
		const { teamId, channelId, messageId, replyId } = context.propsValue;

		const client = createGraphClient(context.auth.access_token);

		// https://learn.microsoft.com/graph/api/chatmessage-get?view=graph-rest-1.0
		const base = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
		const path = replyId ? `${base}/replies/${replyId}` : base;
		return await withGraphRetry(() => client.api(path).get());
	},
});


