import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { generateChatCompletionOutputSchema } from '../output-schemas';

export const generateChatCompletion = createAction({
	auth: mistralAuth,
	name: 'generate_chat_completion',
	classification: 'READ',
	displayName: 'Generate Chat Completion',
	description: 'Generate a reply from a Mistral chat model given a system prompt and a list of messages.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Generates one assistant reply from a Mistral chat model for a multi-turn message list, with an optional system prompt and JSON output mode, and returns the reply text plus finish reason and token usage. Pick this for stateless text generation where you supply the whole history; use Start Conversation instead when Mistral should store the thread or run a Mistral agent. Model ids come from List Models. Not idempotent: each call bills a new completion and the wording varies unless a random seed is set.',
		idempotent: false,
	},
	outputSchema: generateChatCompletionOutputSchema,
	props: {
		model: Property.ShortText({
			displayName: 'Model',
			description: 'Chat model id, e.g. mistral-large-latest or mistral-small-latest. Use List Models to see what your key can access.',
			required: true,
			defaultValue: 'mistral-small-latest',
		}),
		system_prompt: Property.LongText({
			displayName: 'System Prompt',
			description: 'Optional instructions that set the model behaviour for the whole reply.',
			required: false,
		}),
		messages: Property.Array({
			displayName: 'Messages',
			description: 'The conversation so far, oldest first. The last message is usually from the user.',
			required: true,
			properties: {
				role: Property.StaticDropdown({
					displayName: 'Role',
					required: true,
					defaultValue: 'user',
					options: {
						options: [
							{ label: 'User', value: 'user' },
							{ label: 'Assistant', value: 'assistant' },
						],
					},
				}),
				content: Property.LongText({ displayName: 'Content', required: true }),
			},
		}),
		response_format: Property.StaticDropdown({
			displayName: 'Response Format',
			description: 'Choose JSON to force the model to return a valid JSON object. Also ask for JSON in the prompt.',
			required: false,
			defaultValue: 'text',
			options: {
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'JSON object', value: 'json_object' },
				],
			},
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			description: 'Sampling temperature between 0 and 1.5. Mistral recommends 0 to 0.7.',
			required: false,
		}),
		max_tokens: Property.Number({
			displayName: 'Max Tokens',
			description: 'Maximum number of tokens to generate.',
			required: false,
		}),
		random_seed: Property.Number({
			displayName: 'Random Seed',
			description: 'Set a seed to make repeated calls return the same output.',
			required: false,
		}),
	},
	async run(context) {
		const { model, system_prompt, messages, response_format, temperature, max_tokens, random_seed } = context.propsValue;
		const conversation = (messages ?? []).filter(mistralApi.isRecord).map((message) => ({
			role: message['role'] === 'assistant' ? 'assistant' : 'user',
			content: String(message['content'] ?? ''),
		}));
		if (conversation.length === 0) {
			throw new Error('Provide at least one message.');
		}
		const body = mistralApi.compact({
			model,
			messages: system_prompt ? [{ role: 'system', content: system_prompt }, ...conversation] : conversation,
			response_format: response_format && response_format !== 'text' ? { type: response_format } : undefined,
			temperature,
			max_tokens,
			random_seed,
		});
		const response = await mistralApi.call<ChatCompletionResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/chat/completions',
			body,
			timeout: 120000,
		});
		const choice = response.choices[0];
		return {
			id: response.id,
			model: response.model,
			content: mistralApi.contentToText(choice?.message?.content),
			finish_reason: choice?.finish_reason ?? null,
			prompt_tokens: response.usage?.prompt_tokens ?? null,
			completion_tokens: response.usage?.completion_tokens ?? null,
			total_tokens: response.usage?.total_tokens ?? null,
		};
	},
});

type ChatCompletionResponse = {
	id: string;
	model: string;
	choices: { finish_reason: string; message?: { content: unknown } }[];
	usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};
