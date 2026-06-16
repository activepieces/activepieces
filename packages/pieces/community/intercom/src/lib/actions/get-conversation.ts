import { intercomAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { conversationIdProp } from '../common/props';
import { intercomClient } from '../common';

export const getConversationAction = createAction({
	auth: intercomAuth,
	name: 'get-conversation',
	displayName: 'Retrieve a Conversation',
	description: 'Retrieves a specific conversation by ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetch a single Intercom conversation by its conversation ID. Use when you already have the exact ID and need its full details (messages, parts, assignee, state); read-only and repeatable. To locate a conversation by subject, body, author, assignee, or tag instead, use Find Conversation.', idempotent: true },
	props: {
		conversationId: conversationIdProp('Conversation ID', true),
	},
	async run(context) {
		const { conversationId } = context.propsValue;
		const client = intercomClient(context.auth);

		if (!conversationId) {
			throw new Error('Conversation ID is required');
		}

		const response = await client.conversations.find({
			conversation_id: conversationId,
		});

        return response;
	},
});
