import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const createChatAndSendMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_chat_and_send_message',
	displayName: 'Create Chat & Send Message',
	description: 'Start a new chat and send an initial message.',
	props: {
		chatType: Property.StaticDropdown({
			displayName: 'Chat Type',
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
		topic: Property.ShortText({
			displayName: 'Chat Topic',
			description: 'Title of the chat (required for group chats)',
			required: false,
		}),
		memberEmails: Property.Array({
			displayName: 'Member Emails',
			description: 'Email addresses of users to add to the chat (excluding yourself)',
			required: true,
		}),
		sendInitialMessage: Property.Checkbox({
			displayName: 'Send Initial Message',
			description: 'Send a message immediately after creating the chat',
			required: false,
			defaultValue: false,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			required: false,
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
		initialMessage: Property.LongText({
			displayName: 'Message',
			required: false,
		}),
	},
	async run(context) {
		const { chatType, topic, memberEmails, sendInitialMessage, contentType, initialMessage } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Get user IDs from emails
		const members = [];
		for (const email of memberEmails) {
			try {
				const user = await client.api(`/users/${email}`).get();
				members.push({
					'@odata.type': '#microsoft.graph.aadUserConversationMember',
					roles: ['owner'],
					'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${user.id}')`,
				});
			} catch (error) {
				throw new Error(`Failed to find user with email: ${email}`);
			}
		}

		// Add current user as owner
		const currentUser = await client.api('/me').get();
		members.push({
			'@odata.type': '#microsoft.graph.aadUserConversationMember',
			roles: ['owner'],
			'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${currentUser.id}')`,
		});

		const chat = {
			chatType: chatType,
			members: members,
			...(topic && { topic: topic }),
		};

		// Create the chat
		const createdChat = await client.api('/chats').post(chat);

		// Send initial message if requested
		if (sendInitialMessage && initialMessage) {
			const chatMessage = {
				body: {
					contentType: contentType || 'text',
					content: initialMessage,
				},
			};

			const sentMessage = await client.api(`/chats/${createdChat.id}/messages`).post(chatMessage);
			
			return {
				chat: createdChat,
				initialMessage: sentMessage,
			};
		}

		return {
			chat: createdChat,
		};
	},
});