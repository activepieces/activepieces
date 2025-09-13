import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

interface ChatPayload {
	chatType: 'oneOnOne' | 'group';
	members: Array<{
		'@odata.type': string;
		roles: string[];
		'user@odata.bind': string;
	}>;
	topic?: string;
}

export const createChatAndSendMessage = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_chat_and_send_message',
	displayName: 'Create Chat and Send Message',
	description: 'Start a new chat and send an initial message.',
	props: {
		chatType: Property.StaticDropdown({
			displayName: 'Chat Type',
			description: 'The type of chat to create',
			required: true,
			defaultValue: 'oneOnOne',
			options: {
				disabled: false,
				options: [
					{
						label: 'One-on-One',
						value: 'oneOnOne',
					},
					{
						label: 'Group',
						value: 'group',
					},
				],
			},
		}),
		participantEmails: Property.LongText({
			displayName: 'Participant Emails',
			description: 'Comma-separated list of email addresses of participants (excluding yourself)',
			required: true,
		}),
		topic: Property.ShortText({
			displayName: 'Chat Topic',
			description: 'The title of the chat (required for group chats, optional for one-on-one)',
			required: false,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Message Content Type',
			description: 'The content type of the initial message',
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
		message: Property.LongText({
			displayName: 'Initial Message',
			description: 'The content of the initial message to send',
			required: true,
		}),
	},
	async run(context) {
		const { chatType, participantEmails, topic, contentType, message } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Parse participant emails
		const emails = participantEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);

		// Get current user info
		const currentUser = await client.api('/me').get();

		// Build members array
		const members = [
			{
				'@odata.type': '#microsoft.graph.aadUserConversationMember',
				roles: ['owner'],
				'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${currentUser.id}')`
			}
		];

		// Add participants
		for (const email of emails) {
			members.push({
				'@odata.type': '#microsoft.graph.aadUserConversationMember',
				roles: ['owner'],
				'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${email}')`
			});
		}

		// Create chat payload
		const chatPayload: ChatPayload = {
			chatType: chatType as 'oneOnOne' | 'group',
			members: members
		};

		// Add topic for group chats
		if (chatType === 'group' && topic) {
			chatPayload.topic = topic;
		}
		const createdChat = await client.api('/chats').post(chatPayload);
		const messagePayload = {
			body: {
				content: message,
				contentType: contentType,
			},
		};

		const sentMessage = await client.api(`/chats/${createdChat.id}/messages`).post(messagePayload);

		return {
			chat: createdChat,
			message: sentMessage,
			chatId: createdChat.id,
			messageId: sentMessage.id,
		};
	},
});
