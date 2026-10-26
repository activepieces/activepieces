import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeSearchDocumentsOutputSchema } from '../../output-schemas';

export const pineconeSearchDocumentsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_search_documents',
	outputSchema: pineconeSearchDocumentsOutputSchema,
	displayName: 'Search Documents',
	description: 'Searches documents by full-text query or by vector similarity.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches a namespace and returns the Top K documents. Scoring Method: "text" (BM25 over Fields with Query), "query_string" (Lucene syntax in Query), "dense_vector" (Query Vector against Field, e.g. "embedding") or "sparse_vector" (Sparse Indices/Values against Field). Optional metadata filter. Works only on documents indexes (created by Create Index with Full-Text Fields).',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		scoringMethod: Property.StaticDropdown<
			'text' | 'query_string' | 'dense_vector' | 'sparse_vector',
			true
		>({
			displayName: 'Scoring Method',
			description: 'How documents are ranked: text, query_string, dense_vector or sparse_vector.',
			required: true,
			options: {
				options: [
					{ label: 'Full-text (BM25)', value: 'text' },
					{ label: 'Lucene query string', value: 'query_string' },
					{ label: 'Dense vector', value: 'dense_vector' },
					{ label: 'Sparse vector', value: 'sparse_vector' },
				],
			},
		}),
		topK: Property.Number({
			displayName: 'Top K',
			description: 'Number of documents to return, 1-10000.',
			required: true,
		}),
		query: Property.LongText({
			displayName: 'Query',
			description: 'Text query, for text and query_string scoring.',
			required: false,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Full-text fields to search, for text scoring, e.g. ["title", "body"].',
			required: false,
		}),
		field: Property.ShortText({
			displayName: 'Field',
			description:
				'Vector field to score against, for dense_vector or sparse_vector scoring, e.g. "embedding".',
			required: false,
		}),
		vector: Property.Array({
			displayName: 'Query Vector',
			description: 'Dense query vector, for dense_vector scoring.',
			required: false,
		}),
		sparseIndices: Property.Array({
			displayName: 'Sparse Indices',
			description: 'Sparse query positions, for sparse_vector scoring.',
			required: false,
		}),
		sparseValues: Property.Array({
			displayName: 'Sparse Values',
			description: 'Sparse query values, for sparse_vector scoring.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Metadata Filter',
			description: 'Only return documents matching this filter, e.g. {"year": {"$gte": 2020}}.',
			required: false,
		}),
		includeFields: Property.Array({
			displayName: 'Include Fields',
			description:
				'Document fields to return, e.g. ["title", "body"]. Leave empty to return only IDs and scores.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const scoreBy = {
			type: p.scoringMethod,
			...(p.query !== undefined ? { query: p.query } : {}),
			...(p.fields !== undefined
				? { fields: pineconeUtils.toStringList({ value: p.fields, propName: 'Fields' }) }
				: {}),
			...(p.field !== undefined ? { field: p.field } : {}),
			...(p.vector !== undefined
				? { values: pineconeUtils.toNumberList({ value: p.vector, propName: 'Query Vector' }) }
				: {}),
			...(p.sparseIndices !== undefined && p.sparseValues !== undefined
				? {
						sparseValues: pineconeUtils.toSparseValues({
							indices: p.sparseIndices,
							values: p.sparseValues,
							propName: 'Sparse',
						}),
				  }
				: {}),
		};
		const documents = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		}).documents;
		return await documents.search({
			scoreBy: [scoreBy],
			topK: p.topK,
			...(p.filter !== undefined ? { filter: p.filter } : {}),
			...(p.includeFields !== undefined
				? {
						includeFields: pineconeUtils.toStringList({
							value: p.includeFields,
							propName: 'Include Fields',
						}),
				  }
				: {}),
		});
	},
});
