import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { AgentResponse, ItemAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const generateAgentAction = createAction({
	auth: taskadeAuth,
	name: 'generate_agent',
	displayName: 'Generate AI Agent',
	description: 'Creates a new AI agent from a plain-language description. Uses Taskade AI credits.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new Taskade AI agent in a workspace or folder from a plain-language description of what it should do; Taskade writes its name, system prompt and commands. Returns the new agent ID. Uses Taskade AI credits; not idempotent: each call creates another agent.',
		idempotent: false,
	},
	props: {
		folderId: taskadeAiProps.folderId(),
		description: Property.LongText({
			displayName: 'What the Agent Should Do',
			description: 'For example: "An agent that drafts friendly replies to customer support emails".',
			required: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['agent'],
	async run(context) {
		const text = taskadeApi.requireText({ value: context.propsValue.description, label: 'What the Agent Should Do' });
		const response = await taskadeApi.request<ItemAPIResponse<AgentResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/folders/${taskadeApi.seg({ value: context.propsValue.folderId, label: 'Folder ID' })}/agent-generate`,
			operation: 'generate agent',
			body: { text },
			timeoutMs: GENERATE_TIMEOUT_MS,
		});
		return taskadeNormalize.agent({ raw: response.item, includePrompts: true });
	},
});

const GENERATE_TIMEOUT_MS = 180_000;
