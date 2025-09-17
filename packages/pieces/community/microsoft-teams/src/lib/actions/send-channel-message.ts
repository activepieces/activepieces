import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const sendChannelMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_send_channel_message',
	displayName: 'Send Channel Message',
	description: "Sends a message to a teams's channel.",
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
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
			displayName: 'Message',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, channelId, contentType, content } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		//https://learn.microsoft.com/en-us/graph/api/channel-post-messages?view=graph-rest-1.0&tabs=http
		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};

		return await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post(chatMessage);
	},
});
