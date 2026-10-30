import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { commonProps, intercomClient } from '../common';
import { conversationIdProp } from '../common/props';
import { conversationOutputSchema } from '../output-schemas';

export const assignConversationAction = createAction({
	auth: intercomAuth,
	name: 'assignConversationAction',
	classification: 'WRITE',
	displayName: 'Assign conversation to an admin or a team',
	description: '(Re)assign conversation to a specific admin or team.',
	audience: 'human',
	aiMetadata: { description: 'Reassign an existing conversation to a specific admin or team by assignee ID, optionally with a message body. The assignee converges on retry, but each call logs a new assignment part and posts the optional message again, so it is not idempotent. The assignee ID must be a valid admin or team ID.', idempotent: false },
	props: {
		from: commonProps.admins({ displayName: 'From (Admin)', required: true }),
		conversationId:conversationIdProp('Conversation ID', true),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'The ID of the admin or team to assign this conversation to',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Message Body',
			required: false,
		}),
	},
	outputSchema: conversationOutputSchema,
	async run(context) {
		const client = await intercomClient(context.auth);

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