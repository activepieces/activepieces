import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { parseMistralError } from '../common/props';
import { mistralRequest } from '../common/request';

export const createEmbeddings = createAction({
  audience: 'both',
	auth: mistralAuth,
	name: 'create_embeddings',
	displayName: 'Create Embeddings',
	description: 'Creates new embedding in Mistral AI.',
	aiMetadata: { description: 'Converts an array of text strings into numeric embedding vectors using Mistral\'s fixed mistral-embed model; the model is not selectable here, unlike the sibling Ask Mistral action, and a whole batch of strings is embedded in one call. Use it for semantic search, similarity, or clustering pipelines, and pick Ask Mistral when you need generated prose rather than numbers. Requires a non-empty array of input strings; idempotent: nothing is created server-side and the same input yields the same vectors.', idempotent: true },
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
		const { baseUrl, headers } = mistralRequest.getConfig(context.auth);
		let inputArr: string[] = [];
		try {
			if (typeof input === 'string') {
				try {
					inputArr = JSON.parse(input);
				} catch {
					inputArr = input;
				}
			}
			inputArr = input as string[];
		} catch {
			throw new Error('Input must be a non-empty string or a JSON array of non-empty strings');
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
					headers,
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
