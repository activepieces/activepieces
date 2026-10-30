import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ConversationResponse, ListAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listAgentConversationsAction = createAction({
	auth: taskadeAuth,
	name: 'list_agent_conversations',
	displayName: 'List Agent Conversations',
	description: 'Lists the conversations of an AI agent.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the conversations of one Taskade AI agent with ID, title and status, one page at a time. Use to get a conversation ID for Get Agent Conversation; pass nextPage to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		agentId: taskadeAiProps.agentId(),
		limit: taskadeAiProps.limit({ max: 100, defaultValue: 20 }),
		page: taskadeAiProps.page(),
	},
	outputSchema: taskadeOutputSchemas['listConversations'],
	async run(context) {
		const limit = taskadeApi.validateInteger({ value: context.propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 20;
		const page = taskadeApi.validateInteger({ value: context.propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
		const response = await taskadeApi.request<ListAPIResponse<ConversationResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/agents/${taskadeApi.seg({ value: context.propsValue.agentId, label: 'Agent ID' })}/convos/`,
			operation: 'list agent conversations',
			query: { limit, page },
		});
		const rawItems = response.items ?? [];
		const items = rawItems.map((item) => taskadeNormalize.conversation(item));
		return taskadeNormalize.pageOutput({ items, fetched: rawItems.length, page, limit });
	},
});
