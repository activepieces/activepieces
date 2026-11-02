import { intercomAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { conversationIdProp } from '../common/props';
import { intercomClient } from '../common';
import { conversationWithPartsOutputSchema } from '../output-schemas';

export const getConversationAction = createAction({
	auth: intercomAuth,
	name: 'get-conversation',
	classification: 'READ',
	displayName: 'Retrieve a Conversation',
	description: 'Retrieves a specific conversation by ID.',
	audience: 'human',
	aiMetadata: { description: 'Fetch a single Intercom conversation by its conversation ID. Use when you already have the exact ID and need its full details (messages, parts, assignee, state); read-only and repeatable. To locate a conversation by subject, body, author, assignee, or tag instead, use Find Conversation.', idempotent: true },
	props: {
		conversationId: conversationIdProp('Conversation ID', true),
	},
	outputSchema: conversationWithPartsOutputSchema,
	async run(context) {
		const { conversationId } = context.propsValue;
		const client = await intercomClient(context.auth);

		if (!conversationId) {
			throw new Error('Conversation ID is required');
		}

		const response = await client.conversations.find({
			conversation_id: conversationId,
		});

        return response;
	},
});
