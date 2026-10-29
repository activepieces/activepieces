import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { modelDropdown, parseMistralError } from '../common/props';
import { mistralRequest } from '../common/request';
import { mistralApi } from '../common/client';

export const createChatCompletion = createAction({
  audience: 'human',
	auth: mistralAuth,
	name: 'create_chat_completion',
	classification: 'READ',
	displayName: 'Ask Mistral',
	description: 'Ask a Mistral model a question and get its answer.',
	aiMetadata: { description: 'Sends one user prompt to a Mistral chat model through the chat-completions endpoint and returns only the assistant text of the first choice, with optional temperature, top-p, max-token and random-seed controls; it is stateless, with no conversation memory or system message. This is the piece\'s only text-generation action - prefer Create Embeddings when you need vectors rather than prose, and Run OCR when the text must be pulled out of a PDF or image instead of generated. Requires a model id from the account\'s live model list and a question; not idempotent: each call bills a fresh completion and the wording varies unless a random seed is pinned.', idempotent: false },
	propertyGroups: [
		{ key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['model', 'max_tokens'] },
		{ key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['prompt'] },
	],
	props: {
		model: modelDropdown,
		prompt: Property.LongText({
			displayName: 'Question',
			description: 'What you want the model to answer or do.',
			placeholder: 'e.g. Summarize this email in three bullet points',
			required: true,
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			required: false,
			defaultValue: 1,
			description: 'From 0 to 1.5. Lower is more focused, higher is more varied.',
			advanced: true,
		}),
		top_p: Property.Number({
			displayName: 'Top P',
			required: false,
			defaultValue: 1,
			description: 'From 0 to 1. Adjust this or Temperature, not both.',
			advanced: true,
		}),
		max_tokens: Property.Number({
			displayName: 'Max Tokens',
			description: 'Longest reply in tokens, about 4 characters each.',
			required: false,
		}),
		random_seed: Property.Number({
			displayName: 'Random Seed',
			description: 'Set a seed to make repeated calls return the same output.',
			required: false,
			advanced: true,
		}),
		timeout: Property.Number({
			displayName: 'Timeout',
			description: 'Milliseconds to wait for a response. Empty: 30 seconds.',
			required: false,
			defaultValue: 30000,
			advanced: true,
		}),
	},
	async run(context) {
		const { model, temperature, top_p, max_tokens, random_seed, timeout, prompt } = context.propsValue;
		const { baseUrl, headers } = mistralRequest.getConfig(context.auth);

		const body: Record<string, unknown> = {
			model,
			messages: [
				{
					content: prompt,
					role: 'user',
				},
			],
			temperature,
			top_p,
			max_tokens,
			random_seed,
		};
		let lastErr;
		for (let attempt = 0; attempt <= 3; ++attempt) {
			try {
				const response = await httpClient.sendRequest<ChatCompletionResponse>({
					method: HttpMethod.POST,
					url: `${baseUrl}/chat/completions`,
					headers,
					body,
					timeout: timeout ?? 30000,
				});

				const choices = response.body.choices ?? [];
				if (choices.length === 0) {
					throw new Error('Mistral returned no answer.');
				}
				return mistralApi.contentToText(choices[0].message?.content) ?? '';
			} catch (e: any) {
				lastErr = e;
				const status = e.response?.status;
				if (status === 429 || (status && status >= 500 && status < 600)) {
					if (attempt < 3) {
						await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
						continue;
					}
				}
				throw new Error(parseMistralError({ error: e, baseUrl }));
			}
		}
		throw new Error(parseMistralError({ error: lastErr, baseUrl }));
	},
});

type ChatCompletionResponse = {
	choices?: { message?: { content?: unknown } }[];
};
