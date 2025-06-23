import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { commonProps, intercomClient } from '../common';
import { conversationIdProp } from '../common/props';

export const addNoteToConversationAction = createAction({
	auth: intercomAuth,
	name: 'addNoteToConversation',
	displayName: 'Add note to conversation',
	description: 'Add a note (for other admins) to an existing conversation',
	props: {
		from: commonProps.admins({ displayName: 'From (Admin)', required: true }),
		conversationId:conversationIdProp('Conversation ID', true),
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
				message_type: 'note',
				body: context.propsValue.body,
				admin_id: context.propsValue.from,
			},
		});

		return response;
	},
});
