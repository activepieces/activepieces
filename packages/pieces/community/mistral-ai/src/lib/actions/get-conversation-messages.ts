import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { ConversationEntry, conversationUtils } from '../common/conversations';
import { conversationMessagesOutputSchema } from '../output-schemas';

export const getConversationMessages = createAction({
	auth: mistralAuth,
	name: 'get_conversation_messages',
	classification: 'READ',
	displayName: 'Get Conversation Messages',
	description: 'Get the user and assistant messages of a conversation (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns only the user and assistant messages of a stored conversation (Beta), in order, as role and text. Use it to read the transcript; use Get Conversation History when you also need tool calls or entry ids. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: conversationMessagesOutputSchema,
	props: {
		conversation_id: conversationUtils.conversationIdProp(),
	},
	async run(context) {
		const response = await mistralApi.call<{ conversation_id: string; messages: ConversationEntry[] }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/conversations/${encodeURIComponent(context.propsValue.conversation_id)}/messages`,
		});
		const messages = response.messages.map(conversationUtils.formatEntry);
		return { conversation_id: response.conversation_id, messages, count: messages.length };
	},
});
