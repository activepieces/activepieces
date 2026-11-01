import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { AgentResponse, ItemAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const askAgentAction = createAction({
	auth: taskadeAuth,
	name: 'ask_agent',
	displayName: 'Ask AI Agent',
	description: 'Sends a prompt to a Taskade AI agent and returns its answer. Uses Taskade AI credits.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a prompt to a Taskade AI agent and returns its written answer (can take up to a few minutes). Use to delegate research, writing or summaries to an agent the user set up; get agent IDs from List AI Agents. Uses Taskade AI credits and starts a new conversation each time, so it is not idempotent.',
		idempotent: false,
	},
	props: {
		agentId: taskadeAiProps.agentId(),
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: true,
		}),
		workspaceId: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'Optional. The agent\'s workspace ID; looked up from the agent when empty (one extra request).',
			required: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['askAgent'],
	async run(context) {
		const token = context.auth.secret_text;
		const agentId = taskadeApi.parseId({ value: context.propsValue.agentId, label: 'Agent ID' });
		const prompt = taskadeApi.requireText({ value: context.propsValue.prompt, label: 'Prompt' });
		if (prompt.length > MAX_PROMPT) {
			throw new Error(`Prompt is ${prompt.length} characters; keep it under ${MAX_PROMPT}.`);
		}
		const given = (context.propsValue.workspaceId ?? '').trim();
		const spaceId = given.length > 0 ? given : await lookupSpaceId({ token, agentId });
		const response = await taskadeApi.request<{ ok: boolean; summary?: string }>({
			token,
			method: HttpMethod.POST,
			version: 'v2',
			path: '/promptAgent',
			operation: 'prompt agent',
			body: { spaceId, agentId, prompt },
			timeoutMs: PROMPT_TIMEOUT_MS,
		});
		return { agentId, spaceId, response: response.summary ?? '' };
	},
});

async function lookupSpaceId({ token, agentId }: { token: string; agentId: string }): Promise<string> {
	const agent = await taskadeApi.request<ItemAPIResponse<AgentResponse>>({
		token,
		method: HttpMethod.GET,
		path: `/agents/${taskadeApi.seg({ value: agentId, label: 'Agent ID' })}`,
		operation: 'get agent',
	});
	const spaceId = agent.item?.space_id;
	if (!spaceId) {
		throw new Error('Taskade did not return the agent\'s workspace ID. Pass Workspace ID explicitly.');
	}
	return spaceId;
}

const PROMPT_TIMEOUT_MS = 240_000;
const MAX_PROMPT = 100_000;
