import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeListModelsOutputSchema } from '../../output-schemas';

export const pineconeListModelsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_models',
	outputSchema: pineconeListModelsOutputSchema,
	displayName: 'List Models',
	description: 'Lists the hosted embedding and reranking models.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the Pinecone-hosted models with their type (embed or rerank), vector type, dimensions and limits. Use a model name with Generate Embeddings, Rerank Documents or Create Index for Embedding Model.',
		idempotent: true,
	},
	props: {
		type: Property.StaticDropdown<'embed' | 'rerank', false>({
			displayName: 'Type',
			description: 'Only list embedding or reranking models.',
			required: false,
			options: {
				options: [
					{ label: 'Embed', value: 'embed' },
					{ label: 'Rerank', value: 'rerank' },
				],
			},
		}),
		vectorType: Property.StaticDropdown<'dense' | 'sparse', false>({
			displayName: 'Vector Type',
			description: 'Only list embedding models producing dense or sparse vectors.',
			required: false,
			options: {
				options: [
					{ label: 'Dense', value: 'dense' },
					{ label: 'Sparse', value: 'sparse' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		return await client.inference.listModels({
			...(p.type !== undefined ? { type: p.type } : {}),
			...(p.vectorType !== undefined ? { vectorType: p.vectorType } : {}),
		});
	},
});
