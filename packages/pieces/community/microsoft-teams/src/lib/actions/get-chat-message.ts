import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const getChatMessage = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_chat_message',
	displayName: 'Get Chat Message',
	description: 'Fetches a specific chat message from a Microsoft Teams chat.',
	props: {
		chatId: microsoftTeamsCommon.chatId,
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the message to retrieve',
			required: true,
		}),
	},
	async run(context) {
		const { chatId, messageId } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// https://learn.microsoft.com/en-us/graph/api/chatmessage-get?view=graph-rest-1.0&tabs=http
		return await client.api(`/chats/${chatId}/messages/${messageId}`).get();
	},
});
