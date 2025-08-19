import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { modelDropdown, parseMistralError } from '../common/props';

export const createChatCompletion = createAction({
	auth: mistralAuth,
	name: 'create_chat_completion',
	displayName: 'Ask Mistral',
	description: 'Ask Mistral anything you want!',
	props: {
		model: modelDropdown,
		prompt: Property.LongText({
			displayName: 'Question',
			required: true,
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			required: false,
			defaultValue: 1,
			description:
				'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
		}),
		top_p: Property.Number({
			displayName: 'Top P',
			required: false,
			defaultValue: 1,
			description:
				'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
		}),
		max_tokens: Property.Number({ displayName: 'Max Tokens', required: false }),
		random_seed: Property.Number({ displayName: 'Random Seed', required: false }),
		timeout: Property.Number({ displayName: 'Timeout (ms)', required: false, defaultValue: 30000 }),
	},
	async run(context) {
		const { model, temperature, top_p, max_tokens, random_seed, timeout, prompt } = context.propsValue;

		const body: Record<string, any> = {
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
			random_seed
		};
		let lastErr;
		for (let attempt = 0; attempt <= 3; ++attempt) {
			try {
				const response = await httpClient.sendRequest<{choices:{message:{content:string}}[]}>({
					method: HttpMethod.POST,
					url: 'https://api.mistral.ai/v1/chat/completions',
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: context.auth,
					},
					body,
					timeout: timeout ?? 30000,
				});

				const answer = response.body.choices[0].message.content;

				return answer;
			} catch (e: any) {
				lastErr = e;
				const status = e.response?.status;
				if (status === 429 || (status && status >= 500 && status < 600)) {
					if (attempt < 3) {
						await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
						continue;
					}
				}
				throw new Error(parseMistralError(e));
			}
		}
		throw new Error(parseMistralError(lastErr));
	},
});
