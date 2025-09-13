import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, withGraphRetry } from '../common/graph';

export const replyToChannelMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_reply_to_channel_message',
	displayName: 'Reply to Channel Message',
	description: 'Post a reply to an existing channel message.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
		messageId: Property.ShortText({
			displayName: 'Message ID',
			required: true,
			description: 'ID of the parent message to reply to.'
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			required: true,
			defaultValue: 'text',
			options: {
				disabled: false,
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'HTML', value: 'html' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Message',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, channelId, messageId, contentType, content } = context.propsValue;

		const client = createGraphClient(context.auth.access_token);

		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};

		// https://learn.microsoft.com/graph/api/chatmessage-post-replies?view=graph-rest-1.0
		return await withGraphRetry(() =>
			client
				.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`)
				.post(chatMessage)
		);
	},
});


