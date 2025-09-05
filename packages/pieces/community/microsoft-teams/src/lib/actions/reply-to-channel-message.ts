import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const replyToChannelMessage = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_reply_to_channel_message',
	displayName: 'Reply to Channel Message',
	description: 'Post a reply to an existing channel message.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the message to reply to',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			required: true,
			defaultValue: 'text',
			options: {
				disabled: false,
				options: [
					{
						label: 'Text',
						value: 'text',
					},
					{
						label: 'HTML',
						value: 'html',
					},
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Reply Message',
			description: 'The content of the reply message',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, channelId, messageId, contentType, content } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};

		// https://learn.microsoft.com/en-us/graph/api/channel-post-messagereply?view=graph-rest-1.0&tabs=http
		return await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`).post(chatMessage);
	},
});
