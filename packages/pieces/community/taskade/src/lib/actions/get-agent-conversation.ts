import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ConversationResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const getAgentConversationAction = createAction({
	auth: taskadeAuth,
	name: 'get_agent_conversation',
	displayName: 'Get Agent Conversation',
	description: 'Gets one conversation of an AI agent, with its transcript.',
	classification: 'READ',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns one conversation of a Taskade AI agent (title, status) and, unless turned off, its transcript as text, capped at 100,000 characters (truncated=true when cut). Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		agentId: taskadeAiProps.agentId(),
		conversationId: Property.ShortText({
			displayName: 'Conversation ID',
			description: 'Get it from List Agent Conversations.',
			required: true,
		}),
		includeTranscript: Property.Checkbox({
			displayName: 'Include Transcript',
			required: false,
			defaultValue: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['conversation'],
	async run(context) {
		const { agentId, conversationId, includeTranscript } = context.propsValue;
		const withTranscript = includeTranscript !== false;
		const response = await taskadeApi.request<{ ok: boolean; item?: ConversationResponse; transcript?: string }>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			version: 'v2',
			path: '/getConversation',
			operation: 'get agent conversation',
			body: {
				agentId: taskadeApi.requireText({ value: agentId, label: 'Agent ID' }),
				convoId: taskadeApi.requireText({ value: conversationId, label: 'Conversation ID' }),
				includeTranscript: withTranscript,
			},
		});
		if (!response.item) {
			throw new Error('Taskade returned no conversation in its response.');
		}
		const transcript = withTranscript ? response.transcript ?? '' : null;
		const truncated = transcript !== null && transcript.length > MAX_TRANSCRIPT;
		return {
			...taskadeNormalize.conversation(response.item),
			transcript: truncated && transcript !== null ? transcript.slice(0, MAX_TRANSCRIPT) : transcript,
			truncated,
		};
	},
});

const MAX_TRANSCRIPT = 100_000;
