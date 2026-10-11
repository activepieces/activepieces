import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { AgentResponse, ListAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listAgentsAction = createAction({
	auth: taskadeAuth,
	name: 'list_agents',
	displayName: 'List AI Agents',
	description: 'Lists the AI agents in a workspace or folder.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the Taskade AI agents in one workspace or folder (a workspace ID lists its home folder), with ID, name, workspace ID, description and command names, one page at a time. Use to get an agent ID for Ask AI Agent; pass nextPage to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		folderId: taskadeAiProps.folderId(),
		limit: taskadeAiProps.limit({ max: 100, defaultValue: 20 }),
		page: taskadeAiProps.page(),
	},
	outputSchema: taskadeOutputSchemas['listAgents'],
	async run(context) {
		const limit = taskadeApi.validateInteger({ value: context.propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 20;
		const page = taskadeApi.validateInteger({ value: context.propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
		const response = await taskadeApi.request<ListAPIResponse<AgentResponse | null>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/folders/${taskadeApi.seg({ value: context.propsValue.folderId, label: 'Folder ID' })}/agents`,
			operation: 'list agents',
			query: { limit, page },
		});
		const rawItems = response.items ?? [];
		const items = rawItems
			.filter((item): item is AgentResponse => item !== null)
			.map((raw) => taskadeNormalize.agent({ raw, includePrompts: false }));
		return taskadeNormalize.pageOutput({ items, fetched: rawItems.length, page, limit });
	},
});
