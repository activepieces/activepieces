import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeRerankDocumentsOutputSchema } from '../../output-schemas';

export const pineconeRerankDocumentsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_rerank_documents',
	outputSchema: pineconeRerankDocumentsOutputSchema,
	displayName: 'Rerank Documents',
	description: 'Orders documents by relevance to a query with a hosted reranking model.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Scores documents against a query with a hosted reranking model (from List Models) and returns them most relevant first with scores and original positions. Documents are strings, or objects whose Rank Fields hold the text.',
		idempotent: true,
	},
	props: {
		model: Property.ShortText({
			displayName: 'Model',
			description:
				'Reranking model, from List Models, e.g. "bge-reranker-v2-m3" or "cohere-rerank-3.5".',
			required: true,
		}),
		query: Property.LongText({
			displayName: 'Query',
			description: 'The question the documents are ranked against.',
			required: true,
		}),
		documents: Property.Array({
			displayName: 'Documents',
			description:
				'Texts, or objects of string fields, e.g. ["Apples are…"] or [{"id": "1", "text": "Apples are…"}].',
			required: true,
		}),
		rankFields: Property.Array({
			displayName: 'Rank Fields',
			description: 'For object documents: the field(s) holding the text. Defaults to ["text"].',
			required: false,
		}),
		topN: Property.Number({
			displayName: 'Top N',
			description: 'Number of documents to return. Defaults to all.',
			required: false,
		}),
		returnDocuments: Property.Checkbox({
			displayName: 'Return Documents',
			description: 'Include each document in the result, not just its index and score.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		return await client.inference.rerank({
			model: p.model,
			query: p.query,
			documents: pineconeUtils.toRerankDocuments({ value: p.documents, propName: 'Documents' }),
			...(p.rankFields !== undefined
				? {
						rankFields: pineconeUtils.toStringList({
							value: p.rankFields,
							propName: 'Rank Fields',
						}),
				  }
				: {}),
			...(p.topN !== undefined ? { topN: p.topN } : {}),
			...(p.returnDocuments !== undefined ? { returnDocuments: p.returnDocuments } : {}),
		});
	},
});
