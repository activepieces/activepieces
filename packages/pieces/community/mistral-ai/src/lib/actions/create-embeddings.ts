import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { baseUrl } from '../common/common';
import { parseMistralError } from '../common/props';

export const createEmbeddings = createAction({
	auth: mistralAuth,
	name: 'create_embeddings',
	displayName: 'Create Embeddings',
	description: 'Creates new embedding in Mistral AI.',
	props: {
		input: Property.Array({
			displayName: 'Input',
			description: 'The input text for which to create an embedding.',
			required: true,
		}),
		timeout: Property.Number({ displayName: 'Timeout (ms)', required: false, defaultValue: 30000 }),
	},
	async run(context) {
		const { input, timeout } = context.propsValue;
		let inputArr: string[];
		if (typeof input === 'string') {
			try {
				const parsed = JSON.parse(input);
				inputArr = Array.isArray(parsed) ? parsed : [input];
			} catch {
				inputArr = [input];
			}
		} else if (Array.isArray(input)) {
			inputArr = input as string[];
		} else {
			throw new Error('Input must be a string or array of strings');
		}
		const body = {
			model: 'mistral-embed',
			input: inputArr,
		};
		let lastErr;
		for (let attempt = 0; attempt <= 3; ++attempt) {
			try {
				const response = await httpClient.sendRequest({
					method: HttpMethod.POST,
					url: `${baseUrl}/embeddings`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: context.auth,
					},
					body,
					timeout: timeout ?? 30000,
				});

				return response.body;
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
