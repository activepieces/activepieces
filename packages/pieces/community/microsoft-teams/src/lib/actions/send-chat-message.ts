import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, withGraphRetry } from '../common/graph';

export const sendChatMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_send_chat_message',
	displayName: 'Send Chat Message',
	description: 'Sends a message in an existing chat.',
	props: {
		chatId: microsoftTeamsCommon.chatId,
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

		const client = createGraphClient(context.auth.access_token);

		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};

		return await withGraphRetry(() => client.api(`/chats/${chatId}/messages`).post(chatMessage));
	},
});
