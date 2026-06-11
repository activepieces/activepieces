import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { commonProps, intercomClient } from '../common';
import { conversationIdProp } from '../common/props';

export const replyToConversation = createAction({
	auth: intercomAuth,
	name: 'replyToConversation',
	displayName: 'Reply to conversation',
	description: 'Reply (as an admin) to a conversation with a contact',
	audience: 'both',
	aiMetadata: { description: 'Post an admin reply (a customer-visible comment) to an existing conversation. Each call adds a new reply, so it is not idempotent. Use to respond within an ongoing conversation; for an admin-only internal note use Add note to conversation, and to start a brand-new message use Send Message.', idempotent: false },
	props: {
		from: commonProps.admins({ displayName: 'From (Admin)', required: true }),
		conversationId: conversationIdProp('Conversation ID', true),
		body: Property.ShortText({
			displayName: 'Message Body',
			required: true,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		const response = await client.conversations.reply({
			conversation_id: context.propsValue.conversationId!,
			body: {
				type: 'admin',
				message_type: 'comment',
				body: context.propsValue.body,
				admin_id: context.propsValue.from,
			},
		});

		return response;
	},
});
