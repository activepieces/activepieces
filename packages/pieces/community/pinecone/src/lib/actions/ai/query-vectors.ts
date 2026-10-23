import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeQueryVectorsOutputSchema } from '../../output-schemas';

export const pineconeQueryVectorsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_query_vectors',
	outputSchema: pineconeQueryVectorsOutputSchema,
	displayName: 'Query Vectors',
	description: 'Finds the records most similar to a query vector or to a stored record.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Similarity search in a namespace of a vectors index: returns the Top K nearest records with scores. Query by a dense vector (optionally plus sparse values for hybrid search) or by the ID of a stored record; set exactly one of Query Vector or Query Vector ID. Optional metadata filter narrows matches.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		topK: Property.Number({
			displayName: 'Top K',
			description: 'Number of matches to return, 1-10000.',
			required: true,
		}),
		vector: Property.Array({
			displayName: 'Query Vector',
			description: 'Dense query vector, e.g. [0.1, 0.2, 0.3]. Must match the index dimension.',
			required: false,
		}),
		id: Property.ShortText({
			displayName: 'Query Vector ID',
			description: 'ID of a stored record to use as the query, instead of Query Vector.',
			required: false,
		}),
		sparseIndices: Property.Array({
			displayName: 'Sparse Indices',
			description: 'Sparse vector positions, e.g. [10, 45]. Same length as Sparse Values.',
			required: false,
		}),
		sparseValues: Property.Array({
			displayName: 'Sparse Values',
			description: 'Sparse vector values, e.g. [0.5, 0.3]. Same length as Sparse Indices.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Metadata Filter',
			description:
				'Only match records whose metadata matches, e.g. {"genre": {"$in": ["comedy", "drama"]}}.',
			required: false,
		}),
		includeValues: Property.Checkbox({
			displayName: 'Include Values',
			description: "Return each match's vector values.",
			required: false,
		}),
		includeMetadata: Property.Checkbox({
			displayName: 'Include Metadata',
			description: "Return each match's metadata.",
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		if ((p.vector === undefined) === (p.id === undefined)) {
			throw new Error('Set exactly one of "Query Vector" or "Query Vector ID".');
		}
		if ((p.sparseIndices === undefined) !== (p.sparseValues === undefined)) {
			throw new Error('Set "Sparse Indices" and "Sparse Values" together.');
		}
		const index = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		});
		const shared = {
			topK: p.topK,
			includeValues: p.includeValues ?? false,
			includeMetadata: p.includeMetadata ?? false,
			...(p.filter !== undefined ? { filter: p.filter } : {}),
		};
		if (p.id !== undefined) {
			return await index.query({ ...shared, id: p.id });
		}
		return await index.query({
			...shared,
			vector: pineconeUtils.toNumberList({ value: p.vector ?? [], propName: 'Query Vector' }),
			...(p.sparseIndices !== undefined && p.sparseValues !== undefined
				? {
						sparseVector: pineconeUtils.toSparseValues({
							indices: p.sparseIndices,
							values: p.sparseValues,
							propName: 'Sparse',
						}),
				  }
				: {}),
		});
	},
});
