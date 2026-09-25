import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { conversationUtils, ConversationResponse } from '../common/conversations';
import { conversationReplyOutputSchema } from '../output-schemas';

export const startConversation = createAction({
	auth: mistralAuth,
	name: 'start_conversation',
	classification: 'WRITE',
	displayName: 'Start Conversation',
	description: 'Start a stored conversation with a Mistral agent or model (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Starts a new server-side conversation (Beta) with either a Mistral agent (agent id) or a plain model, sends the first message and returns the reply text, all output entries (including tool calls) and the conversation id. This is how you run a Mistral agent; continue with Append to Conversation. Use Generate Chat Completion instead for one-off stateless replies. Not idempotent: each call creates a new conversation and bills a new reply.',
		idempotent: false,
	},
	outputSchema: conversationReplyOutputSchema,
	props: {
		message: Property.LongText({
			displayName: 'Message',
			description: 'The first user message.',
			required: true,
		}),
		agent_id: Property.ShortText({
			displayName: 'Agent ID',
			description: 'Run this agent (from List Agents). Leave empty to talk to a model directly.',
			required: false,
		}),
		model: Property.ShortText({
			displayName: 'Model',
			description: 'Model id to use when no agent is given, e.g. mistral-medium-latest.',
			required: false,
		}),
		instructions: Property.LongText({
			displayName: 'Instructions',
			description: 'System instructions, only used when talking to a model directly.',
			required: false,
		}),
		name: Property.ShortText({ displayName: 'Conversation Name', required: false }),
		store: Property.Checkbox({
			displayName: 'Store Conversation',
			description: 'Keep the conversation on Mistral so it can be continued later.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { message, agent_id, model, instructions, name, store } = context.propsValue;
		if (!agent_id && !model) {
			throw new Error('Provide either an Agent ID or a Model.');
		}
		if (agent_id && model) {
			throw new Error('Provide only one of Agent ID or Model.');
		}
		const response = await mistralApi.call<ConversationResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/conversations',
			body: mistralApi.compact({
				inputs: message,
				agent_id,
				model,
				instructions: agent_id ? undefined : instructions,
				name,
				store: store ?? true,
				stream: false,
			}),
			timeout: 300000,
		});
		return conversationUtils.formatResponse(response);
	},
});
