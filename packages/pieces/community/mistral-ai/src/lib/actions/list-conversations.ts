import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { conversationUtils, MistralConversation } from '../common/conversations';
import { listConversationsOutputSchema } from '../output-schemas';

export const listConversations = createAction({
	auth: mistralAuth,
	name: 'list_conversations',
	classification: 'SEARCH',
	displayName: 'List Conversations',
	description: 'List stored conversations (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists stored Mistral conversations (Beta) with their ids, names, agent or model, and timestamps, one page at a time. Use it to find a conversation id for Append, Restart, History, Messages or Delete. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listConversationsOutputSchema,
	props: {
		page: Property.Number({ displayName: 'Page', description: 'Zero-based page number.', required: false, defaultValue: 0 }),
		page_size: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 100 }),
	},
	async run(context) {
		const { page, page_size } = context.propsValue;
		const response = await mistralApi.call<MistralConversation[]>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/conversations',
			queryParams: { page, page_size },
		});
		const conversations = response.map(conversationUtils.formatConversation);
		return { conversations, count: conversations.length };
	},
});
