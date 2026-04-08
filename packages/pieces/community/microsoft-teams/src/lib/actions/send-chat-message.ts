import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient } from '../common/graph';

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

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};

		return await client.api(`/chats/${chatId}/messages`).post(chatMessage);
	},
});
