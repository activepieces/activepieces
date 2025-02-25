import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { commonProps, intercomClient } from '../common';
import { conversationIdProp } from '../common/props';

export const replyToConversation = createAction({
	auth: intercomAuth,
	name: 'replyToConversation',
	displayName: 'Reply to conversation',
	description: 'Reply (as an admin) to a conversation with a contact',
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
