import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, withGraphRetry } from '../common/graph';

export const getChatMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_chat_message',
	displayName: 'Get Chat Message',
	description: 'Fetch a specific chat message by chat and message ID.',
	props: {
		chatId: microsoftTeamsCommon.chatId,
		messageId: Property.ShortText({
			displayName: 'Message ID',
			required: true,
			description: 'The ID of the message to retrieve.',
		}),
	},
	async run(context) {
		const { chatId, messageId } = context.propsValue;

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

		// https://learn.microsoft.com/graph/api/chatmessage-get?view=graph-rest-1.0
		return await withGraphRetry(() => client.api(`/chats/${chatId}/messages/${messageId}`).get());
	},
});


