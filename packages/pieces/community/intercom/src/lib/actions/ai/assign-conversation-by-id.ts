import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { resolveAdminId } from '../../common/client';
import { requireText } from '../../common/lookups';
import { conversationOutputSchema } from '../../output-schemas';

export const assignConversationByIdAction = createAction({
	auth: intercomAuth,
	name: 'assign_conversation_by_id',
	classification: 'WRITE',
	displayName: 'Assign Conversation (by ID)',
	description: 'Assigns a conversation to an admin or a team, or unassigns it.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Assigns an existing conversation to an admin or a team by ID; assignee ID 0 unassigns it. Get IDs from List Admins or List Teams. No message is posted, and assigning to the same assignee again leaves the same state, so it is safe to retry.',
		idempotent: true,
	},
	props: {
		conversationId: Property.ShortText({
			displayName: 'Conversation ID',
			description: 'The Intercom conversation ID.',
			required: true,
		}),
		assigneeType: Property.StaticDropdown({
			displayName: 'Assign To',
			required: true,
			defaultValue: 'admin',
			options: {
				disabled: false,
				options: [
					{ label: 'Admin', value: 'admin' },
					{ label: 'Team', value: 'team' },
				],
			},
		}),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'The admin or team ID. Use 0 to unassign.',
			required: true,
		}),
		adminId: Property.ShortText({
			displayName: 'Acting Admin ID',
			description: 'The admin who performs the assignment. Leave empty to use the admin who owns this connection.',
			required: false,
		}),
	},
	outputSchema: conversationOutputSchema,
	async run(context) {
		const conversationId = requireText({ label: 'Conversation ID', value: context.propsValue.conversationId });
		const assigneeId = requireText({ label: 'Assignee ID', value: context.propsValue.assigneeId });
		const assigneeType = context.propsValue.assigneeType === 'team' ? 'team' : 'admin';
		const adminId = await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['conversations', conversationId, 'parts'],
			body: { message_type: 'assignment', type: assigneeType, admin_id: adminId, assignee_id: assigneeId },
			operation: 'assign the conversation',
		});
	},
});
