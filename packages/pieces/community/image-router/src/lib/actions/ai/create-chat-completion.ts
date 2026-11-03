import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterAiProps } from '../../common/ai-props';
import { imageRouterApi } from '../../common/api';
import { imageRouterChatCompletionOutputSchema } from '../../output-schemas';

export const createChatCompletionAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_create_chat_completion',
	displayName: 'Create Chat Completion',
	description: 'Sends a conversation to a text model and returns its reply.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends an OpenAI-format list of chat messages to the chosen ImageRouter text model and returns the completion: choices (reply text in choices[0].message.content, finish reason, tool calls), token usage and the credits charged. Pick a model whose output_modalities include text from List Models; text models are paid, so check Get Credits first. Use Create Response for the Responses format with a single input. Not idempotent: each call runs and bills a new completion.',
		idempotent: false,
	},
	props: {
		model: imageRouterAiProps.model({
			required: true,
			description:
				'Text model id, e.g. "openai/gpt-4o-mini". Use List Models with output modality "text" to find ids.',
		}),
		messages: Property.Json({
			displayName: 'Messages',
			description:
				'The conversation as a JSON array of {"role", "content"} objects, e.g. [{"role":"system","content":"Be brief."},{"role":"user","content":"Hi"}]. Roles: system, developer, user, assistant, tool.',
			required: true,
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			description: 'Sampling temperature from 0 to 2. Leave empty for the model default.',
			required: false,
		}),
		maxTokens: Property.Number({
			displayName: 'Max Tokens',
			description: 'Maximum tokens in the reply. Leave empty for the model default.',
			required: false,
		}),
		additionalParameters: Property.Json({
			displayName: 'Additional Parameters',
			description:
				'Optional JSON object of other OpenAI chat parameters passed to the model as-is, e.g. {"top_p":0.9,"response_format":{"type":"json_object"}}. Model, messages, temperature and max tokens above take precedence.',
			required: false,
		}),
	},
	outputSchema: imageRouterChatCompletionOutputSchema,
	async run({ auth, propsValue }) {
		return await imageRouterApi.createChatCompletion({
			auth,
			body: {
				...propsValue.additionalParameters,
				model: propsValue.model,
				messages: propsValue.messages,
				temperature: propsValue.temperature,
				max_tokens: propsValue.maxTokens,
			},
		});
	},
});
