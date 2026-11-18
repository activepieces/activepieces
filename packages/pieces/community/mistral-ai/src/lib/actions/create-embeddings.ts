import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { parseMistralError } from '../common/props';
import { mistralRequest } from '../common/request';
import { createEmbeddingsOutputSchema } from '../output-schemas';

export const createEmbeddings = createAction({
  audience: 'both',
	auth: mistralAuth,
	name: 'create_embeddings',
	classification: 'READ',
	displayName: 'Create Embeddings',
	description: 'Turn a list of texts into vectors with the mistral-embed model.',
	propertyGroups: [
		{ key: 'content', display: 'section', label: 'Content', icon: 'text', props: ['input'] },
	],
	aiMetadata: { description: 'Converts an array of text strings into numeric embedding vectors using Mistral\'s fixed mistral-embed model; the model is not selectable here, unlike the sibling Ask Mistral action, and a whole batch of strings is embedded in one call. Use it for semantic search, similarity, or clustering pipelines, and pick Ask Mistral when you need generated prose rather than numbers. Requires a non-empty array of input strings; idempotent: nothing is created server-side and the same input yields the same vectors.', idempotent: true },
	outputSchema: createEmbeddingsOutputSchema,
	props: {
		input: Property.Array({
			displayName: 'Texts',
			description: 'Each text gets its own vector from the mistral-embed model.',
			required: true,
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
		const { input, timeout } = context.propsValue;
		const { baseUrl, headers } = mistralRequest.getConfig(context.auth);
		const inputArr = toTexts(input);
		if (inputArr.length === 0) {
			throw new Error('Add at least one text to embed.');
		}
		const blankIndex = inputArr.findIndex((text) => text.trim() === '');
		if (blankIndex !== -1) {
			throw new Error(`Text ${blankIndex + 1} is empty. Fill it in or remove it so each vector matches its text.`);
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
				throw new Error(parseMistralError({ error: e, baseUrl }));
			}
		}
		throw new Error(parseMistralError({ error: lastErr, baseUrl }));
	},
});

function toTexts(value: unknown): string[] {
	const list = toInputList(value);
	if (!Array.isArray(list)) {
		return [];
	}
	return list.map((item) => (isNil(item) ? '' : String(item)));
}

function toInputList(value: unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [value];
	} catch {
		return [value];
	}
}
