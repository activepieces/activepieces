import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { isNil } from '@activepieces/shared';
import { Chat } from '@microsoft/microsoft-graph-types';

export const createChatAndSendMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_chat_and_send_message',
	displayName: 'Create Chat & Send Message',
	description: 'Start a new chat and send an initial message.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		members:microsoftTeamsCommon.memberIds(true),
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
		const { members, contentType, content } = context.propsValue;

		
		if (isNil(members)) {
			throw new Error('For one-on-one chats, provide exactly one other member.');
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Resolve current user to include as a member
		const me = await client.api('/me').select('id,userPrincipalName').get();
		const currentUserBind = `https://graph.microsoft.com/v1.0/users('${me.id}')`;

		// Parse provided members
		const otherMembersRaw: string[] = members.map((member)=>`https://graph.microsoft.com/v1.0/users('${member}')`)


		const membersPayload = [
			{
				'@odata.type': '#microsoft.graph.aadUserConversationMember',
				roles: ['owner'],
				'user@odata.bind': currentUserBind,
			},
			...otherMembersRaw.map((m) => ({
				'@odata.type': '#microsoft.graph.aadUserConversationMember',
				roles: ['owner'],
				'user@odata.bind': m,
			})),
		];

		const chatBody: Chat = {
			chatType: otherMembersRaw.length ===1 ? 'oneOnOne':'group',
			members: membersPayload,
		};

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


