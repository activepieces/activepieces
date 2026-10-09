import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterAiProps } from '../../common/ai-props';
import { imageRouterApi } from '../../common/api';
import { imageRouterResponseOutputSchema } from '../../output-schemas';

export const createResponseAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_create_response',
	displayName: 'Create Response',
	description: 'Gets a reply from a text model in the OpenAI Responses format.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a plain-text input, or a JSON array of OpenAI Responses input items (for images or multi-turn input), to the chosen ImageRouter text model and returns the response: output items (the reply text is in output[].content[].text), status, token usage and the credits charged. Pass exactly one of input or inputItems. Text models are paid; check Get Credits first. Use Create Chat Completion for a classic messages list. Not idempotent: each call runs and bills a new response.',
		idempotent: false,
	},
	props: {
		model: imageRouterAiProps.model({
			required: true,
			description:
				'Text model id, e.g. "openai/gpt-4o-mini". Use List Models with output modality "text" to find ids.',
		}),
		input: Property.LongText({
			displayName: 'Input',
			description: 'The prompt as plain text. Use this or Input Items, not both.',
			required: false,
		}),
		inputItems: Property.Json({
			displayName: 'Input Items',
			description:
				'The input as a JSON array of OpenAI Responses input items, e.g. [{"role":"user","content":[{"type":"input_text","text":"Describe this"},{"type":"input_image","image_url":"https://..."}]}]. Use this or Input, not both.',
			required: false,
		}),
		instructions: Property.LongText({
			displayName: 'Instructions',
			description: 'Optional system-level instructions for the model.',
			required: false,
		}),
		maxOutputTokens: Property.Number({
			displayName: 'Max Output Tokens',
			description: 'Maximum tokens in the reply. Leave empty for the model default.',
			required: false,
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			description: 'Sampling temperature from 0 to 2. Leave empty for the model default.',
			required: false,
		}),
		additionalParameters: Property.Json({
			displayName: 'Additional Parameters',
			description:
				'Optional JSON object of other OpenAI Responses parameters passed as-is, e.g. {"top_p":0.9}. The fields above take precedence.',
			required: false,
		}),
	},
	outputSchema: imageRouterResponseOutputSchema,
	async run({ auth, propsValue }) {
		const { input, inputItems } = propsValue;
		if ((input === undefined) === (inputItems === undefined)) {
			throw new Error('Pass exactly one of input or inputItems.');
		}
		return await imageRouterApi.createResponse({
			auth,
			body: {
				...propsValue.additionalParameters,
				model: propsValue.model,
				input: input ?? inputItems,
				instructions: propsValue.instructions,
				max_output_tokens: propsValue.maxOutputTokens,
				temperature: propsValue.temperature,
			},
		});
	},
});
