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
					{ label: 'One-on-one', value: 'oneOnOne' },
					{ label: 'Group', value: 'group' },
				],
			},
		}),
		topic: Property.ShortText({
			displayName: 'Topic (for group chats)',
			required: false,
		}),
		memberIdType: Property.StaticDropdown({
			displayName: 'Member Identifier Type',
			required: true,
			defaultValue: 'email',
			options: {
				disabled: false,
				options: [
					{ label: 'Email (UPN)', value: 'email' },
					{ label: 'Microsoft Entra ID (GUID)', value: 'id' },
				],
			},
		}),
		members: Property.LongText({
			displayName: 'Chat Members (comma or newline separated, exclude yourself)',
			required: true,
			description:
				"Provide the other participant(s) as emails or IDs based on 'Member Identifier Type'. For one-on-one, specify exactly one.",
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Message Content Type',
			required: true,
			defaultValue: 'text',
			options: {
				disabled: false,
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'HTML', value: 'html' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Initial Message',
			required: true,
		}),
	},
	async run(context) {
		const { chatType, topic, memberIdType, members, contentType, content } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Resolve current user to include as a member
		const me = await client.api('/me').select('id,userPrincipalName').get();
		const currentUserBind = `https://graph.microsoft.com/v1.0/users('${me.id}')`;

		// Parse provided members
		const otherMembersRaw: string[] = String(members)
			.split(/\n|,/)
			.map((m) => m.trim())
			.filter((m) => m.length > 0);

		if (chatType === 'oneOnOne' && otherMembersRaw.length !== 1) {
			throw new Error('For one-on-one chats, provide exactly one other member.');
		}

		const toUserBind = (value: string) => {
			if (memberIdType === 'email') {
				return `https://graph.microsoft.com/v1.0/users('${value}')`;
			}
			return `https://graph.microsoft.com/v1.0/users('${value}')`;
		};

		const membersPayload = [
			{
				'@odata.type': '#microsoft.graph.aadUserConversationMember',
				roles: ['owner'],
				'user@odata.bind': currentUserBind,
			},
			...otherMembersRaw.map((m) => ({
				'@odata.type': '#microsoft.graph.aadUserConversationMember',
				roles: ['owner'],
				'user@odata.bind': toUserBind(m),
			})),
		];

		const chatBody: any = {
			chatType,
			members: membersPayload,
		};
		if (chatType === 'group' && topic) {
			chatBody.topic = topic;
		}

		// Create or get existing chat
		const chat = await client.api('/chats').post(chatBody);

		// Send initial message
		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};
		const messageResponse = await client.api(`/chats/${chat.id}/messages`).post(chatMessage);

		return {
			chat,
			message: messageResponse,
		};
	},
});


