import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeSearchTextRecordsOutputSchema } from '../../output-schemas';

export const pineconeSearchTextRecordsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_search_text_records',
	outputSchema: pineconeSearchTextRecordsOutputSchema,
	displayName: 'Search Text Records',
	description: 'Searches records by text, vector or record ID, with optional reranking.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches a namespace and returns the Top K records. Query by Query Text (needs an index from Create Index for Embedding Model), by Query Vector, or by Query Record ID; set exactly one. Optional metadata filter, returned Fields, and reranking with a hosted model (from List Models) over Rerank Fields.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		topK: Property.Number({
			displayName: 'Top K',
			description: 'Number of records to return.',
			required: true,
		}),
		queryText: Property.LongText({
			displayName: 'Query Text',
			description: "Text to search for; Pinecone embeds it with the index's model.",
			required: false,
		}),
		vector: Property.Array({
			displayName: 'Query Vector',
			description: 'Dense query vector, e.g. [0.1, 0.2].',
			required: false,
		}),
		id: Property.ShortText({
			displayName: 'Query Record ID',
			description: 'ID of a stored record to use as the query.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Metadata Filter',
			description:
				'Only match records whose metadata matches, e.g. {"category": {"$eq": "nutrition"}}.',
			required: false,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Record fields to return, e.g. ["chunk_text", "category"]. Leave empty for all.',
			required: false,
		}),
		rerankModel: Property.ShortText({
			displayName: 'Rerank Model',
			description:
				'Hosted reranking model, from List Models, e.g. "bge-reranker-v2-m3". Needs Rerank Fields and Query Text.',
			required: false,
		}),
		rerankFields: Property.Array({
			displayName: 'Rerank Fields',
			description: 'Record fields the reranker reads, e.g. ["chunk_text"].',
			required: false,
		}),
		rerankTopN: Property.Number({
			displayName: 'Rerank Top N',
			description: 'Number of reranked records to return. Defaults to Top K.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const queryModes = [
			p.queryText !== undefined,
			p.vector !== undefined,
			p.id !== undefined,
		].filter(Boolean).length;
		if (queryModes !== 1) {
			throw new Error('Set exactly one of "Query Text", "Query Vector" or "Query Record ID".');
		}
		if ((p.rerankModel === undefined) !== (p.rerankFields === undefined)) {
			throw new Error('Set "Rerank Model" and "Rerank Fields" together.');
		}
		const index = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		});
		return await index.searchRecords({
			query: {
				topK: p.topK,
				...(p.queryText !== undefined ? { inputs: { text: p.queryText } } : {}),
				...(p.vector !== undefined
					? {
							vector: {
								values: pineconeUtils.toNumberList({ value: p.vector, propName: 'Query Vector' }),
							},
					  }
					: {}),
				...(p.id !== undefined ? { id: p.id } : {}),
				...(p.filter !== undefined ? { filter: p.filter } : {}),
			},
			...(p.fields !== undefined
				? { fields: pineconeUtils.toStringList({ value: p.fields, propName: 'Fields' }) }
				: {}),
			...(p.rerankModel !== undefined && p.rerankFields !== undefined
				? {
						rerank: {
							model: p.rerankModel,
							rankFields: pineconeUtils.toStringList({
								value: p.rerankFields,
								propName: 'Rerank Fields',
							}),
							...(p.rerankTopN !== undefined ? { topN: p.rerankTopN } : {}),
							...(p.queryText !== undefined ? { query: p.queryText } : {}),
						},
				  }
				: {}),
		});
	},
});
