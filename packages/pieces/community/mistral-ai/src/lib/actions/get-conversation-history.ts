import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { ConversationEntry, conversationUtils } from '../common/conversations';
import { conversationHistoryOutputSchema } from '../output-schemas';

export const getConversationHistory = createAction({
	auth: mistralAuth,
	name: 'get_conversation_history',
	classification: 'READ',
	displayName: 'Get Conversation History',
	description: 'Get every entry of a conversation, including tool calls (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns every entry of a stored conversation (Beta) in order: user and assistant messages plus tool executions, function calls and agent handoffs, each with its entry id. Use it to find the entry id Restart Conversation needs, or to audit what tools an agent ran; use Get Conversation Messages when you only need the messages. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: conversationHistoryOutputSchema,
	props: {
		conversation_id: conversationUtils.conversationIdProp(),
	},
	async run(context) {
		const response = await mistralApi.call<{ conversation_id: string; entries: ConversationEntry[] }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/conversations/${encodeURIComponent(context.propsValue.conversation_id)}/history`,
		});
		const entries = response.entries.map(conversationUtils.formatEntry);
		return { conversation_id: response.conversation_id, entries, count: entries.length };
	},
});
