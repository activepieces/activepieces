import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeGenerateEmbeddingsOutputSchema } from '../../output-schemas';

export const pineconeGenerateEmbeddingsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_generate_embeddings',
	outputSchema: pineconeGenerateEmbeddingsOutputSchema,
	displayName: 'Generate Embeddings',
	description: 'Turns text into vectors with a Pinecone-hosted embedding model.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Embeds up to 96 texts with a hosted model (from List Models) and returns one vector per input, in order. Most models (e.g. llama-text-embed-v2, multilingual-e5-large) require Input Type. Use the vectors with Upsert Vectors or Query Vectors on an index of the same dimension.',
		idempotent: true,
	},
	props: {
		model: Property.ShortText({
			displayName: 'Model',
			description:
				'Embedding model, from List Models, e.g. "llama-text-embed-v2", "multilingual-e5-large" or "pinecone-sparse-english-v0".',
			required: true,
		}),
		inputs: Property.Array({
			displayName: 'Texts',
			description: 'Texts to embed, e.g. ["Apples are rich in fiber."].',
			required: true,
		}),
		inputType: Property.StaticDropdown<'passage' | 'query', false>({
			displayName: 'Input Type',
			description: '"passage" for text you store, "query" for text you search with.',
			required: false,
			options: {
				options: [
					{ label: 'Passage', value: 'passage' },
					{ label: 'Query', value: 'query' },
				],
			},
		}),
		parameters: Property.Json({
			displayName: 'Other Parameters',
			description:
				'Other model parameters as strings, e.g. {"truncate": "END", "dimension": "512"}.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const parameters = {
			...(p.parameters !== undefined
				? pineconeUtils.toStringMap({ value: p.parameters, propName: 'Other Parameters' })
				: {}),
			...(p.inputType !== undefined ? { input_type: p.inputType } : {}),
		};
		return await client.inference.embed({
			model: p.model,
			inputs: pineconeUtils.toStringList({ value: p.inputs, propName: 'Texts' }),
			...(Object.keys(parameters).length > 0 ? { parameters } : {}),
		});
	},
});
