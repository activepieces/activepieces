import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';

export const sendChatMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_send_chat_message',
	classification: 'WRITE',
	displayName: 'Send Chat Message',
	description: 'Sends a message in an existing chat.',
	audience: 'both',
	aiMetadata: {
		description: 'Sends a message into an existing one-on-one or group chat in Microsoft Teams, identified by chat ID, as plain text or HTML. Use when the target chat already exists; to start a fresh chat use Create Chat & Send Message instead. Not idempotent — each call posts another message.',
		idempotent: false,
	},
	props: {
		chatId: microsoftTeamsProps.chatId({ required: true }),
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
		const { chatId, contentType, content } = context.propsValue;

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};

		return await client.api(`/chats/${chatId}/messages`).post(chatMessage);
	},
});
