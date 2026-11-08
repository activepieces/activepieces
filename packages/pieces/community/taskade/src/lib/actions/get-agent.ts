import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { AgentResponse, ItemAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const getAgentAction = createAction({
	auth: taskadeAuth,
	name: 'get_agent',
	displayName: 'Get AI Agent',
	description: 'Gets an AI agent with its commands and their prompts.',
	classification: 'READ',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns one Taskade AI agent by ID: name, workspace ID, description (its system prompt), whether knowledge is on, and its commands with their prompts. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		agentId: taskadeAiProps.agentId(),
	},
	outputSchema: taskadeOutputSchemas['agent'],
	async run(context) {
		const response = await taskadeApi.request<ItemAPIResponse<AgentResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/agents/${taskadeApi.seg({ value: context.propsValue.agentId, label: 'Agent ID' })}`,
			operation: 'get agent',
		});
		return taskadeNormalize.agent({ raw: response.item, includePrompts: true });
	},
});
