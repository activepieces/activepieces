import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { resolveAdminId } from '../../common/client';
import { requireText } from '../../common/lookups';
import { conversationOutputSchema } from '../../output-schemas';

export const addNoteToConversationByIdAction = createAction({
	auth: intercomAuth,
	name: 'add_note_to_conversation_by_id',
	classification: 'WRITE',
	displayName: 'Add Note to Conversation (by ID)',
	description: 'Adds an internal note, visible only to your team, to a conversation.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds an internal note to an existing conversation; only teammates see it, the customer never does. Use Reply to Conversation (by ID) to answer the customer. Each call adds another note, so retries duplicate.',
		idempotent: false,
	},
	props: {
		conversationId: Property.ShortText({
			displayName: 'Conversation ID',
			description: 'The Intercom conversation ID.',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Note',
			description: 'The note text. Simple HTML is allowed.',
			required: true,
		}),
		adminId: Property.ShortText({
			displayName: 'Admin ID',
			description: 'The admin who writes the note. Leave empty to use the admin who owns this connection.',
			required: false,
		}),
	},
	outputSchema: conversationOutputSchema,
	async run(context) {
		const conversationId = requireText({ label: 'Conversation ID', value: context.propsValue.conversationId });
		const body = requireText({ label: 'Note', value: context.propsValue.body });
		const adminId = await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['conversations', conversationId, 'reply'],
			body: { message_type: 'note', type: 'admin', admin_id: adminId, body },
			operation: 'add a note to the conversation',
		});
	},
});
