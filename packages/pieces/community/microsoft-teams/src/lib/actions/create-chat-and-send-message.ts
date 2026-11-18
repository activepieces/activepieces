import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { isNil } from '@activepieces/pieces-framework';
import type { Chat, MicrosoftTeamsMe } from '../common/types';
import { microsoftTeamsCreateChatAndSendMessageOutputSchema } from '../output-schemas';

export const createChatAndSendMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_chat_and_send_message',
	outputSchema: microsoftTeamsCreateChatAndSendMessageOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Chat & Send Message',
	description: 'Start a new chat and send an initial message.',
	audience: 'human',
	aiMetadata: {
		description: 'Creates a new Microsoft Teams chat with one or more other members (one-on-one when a single member is given, otherwise a group chat) and posts an initial message into it; the current user is automatically added. Use to open a brand-new conversation; to message an existing chat use Send Chat Message instead. Not idempotent — each call may create another chat and posts another message.',
		idempotent: false,
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		members:microsoftTeamsProps.memberIds({ required: true }),
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

		const client = microsoftTeamsClient.create({ auth: context.auth });
		const graphBaseUrl = microsoftTeamsClient.graphUrl({ auth: context.auth });

		const me: MicrosoftTeamsMe = await client.api('/me').select('id,userPrincipalName').get();
		const currentUserBind = `${graphBaseUrl}/v1.0/users('${me.id}')`;

		const otherMembersRaw: string[] = members.map((member) => `${graphBaseUrl}/v1.0/users('${member}')`)


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

		const chat = await client.api('/chats').post(chatBody);

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


