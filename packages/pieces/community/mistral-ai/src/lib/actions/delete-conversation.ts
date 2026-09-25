import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { conversationUtils } from '../common/conversations';
import { deleteConversationOutputSchema } from '../output-schemas';

export const deleteConversation = createAction({
	auth: mistralAuth,
	name: 'delete_conversation',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Conversation',
	description: 'Permanently delete a stored conversation (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a stored conversation (Beta) and its history by conversation id; it can no longer be appended to or restarted. Confirm the id with List Conversations first. Not idempotent: a repeat call fails because the conversation is gone.',
		idempotent: false,
	},
	outputSchema: deleteConversationOutputSchema,
	props: {
		conversation_id: conversationUtils.conversationIdProp(),
	},
	async run(context) {
		const { conversation_id } = context.propsValue;
		await mistralApi.call<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/conversations/${encodeURIComponent(conversation_id)}`,
		});
		return { conversation_id, deleted: true };
	},
});
