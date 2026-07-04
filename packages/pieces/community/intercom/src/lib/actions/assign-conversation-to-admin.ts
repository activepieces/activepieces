import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { commonProps, intercomClient } from '../common';
import { conversationIdProp } from '../common/props';

export const assignConversationAction = createAction({
	auth: intercomAuth,
	name: 'assignConversationAction',
	displayName: 'Assign conversation to an admin or a team',
	description: '(Re)assign conversation to a specific admin or team.',
	audience: 'both',
	aiMetadata: { description: 'Reassign an existing conversation to a specific admin or team by assignee ID, optionally with a message body. Reapplying the same assignee converges on the same state so it is effectively idempotent, though each call logs an assignment part. The assignee ID must be a valid admin or team ID.', idempotent: true },
	props: {
		from: commonProps.admins({ displayName: 'From (Admin)', required: true }),
		conversationId:conversationIdProp('Conversation ID', true),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'The ID of the admin or team to assign this conversation to',
			required: true,
		}),
		body: Property.ShortText({
			displayName: 'Message Body',
			required: false,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		const response = await client.conversations.manage({
			conversation_id: context.propsValue.conversationId!,
			body: {
				type: 'admin',
				message_type: 'assignment',
				admin_id: context.propsValue.from,
				assignee_id: context.propsValue.assigneeId,
				body: context.propsValue.body,
			},
		});

		return response;
	},
});