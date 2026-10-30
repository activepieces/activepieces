import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';

export const getChatMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_chat_message',
	classification: 'READ',
	displayName: 'Get Chat Message',
	description: 'Fetch a specific chat message by chat and message ID.',
	audience: 'human',
	aiMetadata: {
		description: 'Retrieves a single message from a Microsoft Teams chat by chat ID and message ID. Use to read the content or metadata of a known chat message. Idempotent read-only lookup.',
		idempotent: true,
	},
	props: {
		chatId: microsoftTeamsProps.chatId({ required: true }),
		messageId: Property.ShortText({
			displayName: 'Message ID',
			required: true,
			description: 'The ID of the message to retrieve.',
		}),
	},
	async run(context) {
		const { chatId, messageId } = context.propsValue;

		const client = microsoftTeamsClient.create({ auth: context.auth });

		return await microsoftTeamsClient.withRetry(() => client.api(`/chats/${chatId}/messages/${messageId}`).get());
	},
});


