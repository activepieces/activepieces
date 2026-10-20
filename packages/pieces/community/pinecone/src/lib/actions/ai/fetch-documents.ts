import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeFetchDocumentsOutputSchema } from '../../output-schemas';

export const pineconeFetchDocumentsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_fetch_documents',
	outputSchema: pineconeFetchDocumentsOutputSchema,
	displayName: 'Fetch Documents',
	description: 'Gets documents by ID or by metadata filter.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets documents from a namespace by exact IDs or by a metadata filter (set exactly one), returning the fields you ask for, one page at a time. Works only on documents indexes (created by Create Index with Full-Text Fields).',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		ids: Property.Array({
			displayName: 'Document IDs',
			description:
				'IDs of the documents to get, e.g. ["doc-1"], from List Documents or Search Documents.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Filter',
			description: 'Metadata filter selecting documents, e.g. {"year": {"$gte": 2020}}.',
			required: false,
		}),
		includeFields: Property.Array({
			displayName: 'Include Fields',
			description:
				'Document fields to return, e.g. ["title", "body"]. Leave empty to return only IDs and scores.',
			required: false,
		}),
		limit: pineconeAiProps.limit({
			required: false,
			description: 'Maximum number of items to return, 1-100. Defaults to 10.',
		}),
		paginationToken: pineconeAiProps.paginationToken({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		if ((p.ids === undefined) === (p.filter === undefined)) {
			throw new Error('Set exactly one of "Document IDs" or "Filter".');
		}
		const documents = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		}).documents;
		return await documents.fetch({
			...(p.ids !== undefined
				? { ids: pineconeUtils.toStringList({ value: p.ids, propName: 'Document IDs' }) }
				: {}),
			...(p.filter !== undefined ? { filter: p.filter } : {}),
			...(p.includeFields !== undefined
				? {
						includeFields: pineconeUtils.toStringList({
							value: p.includeFields,
							propName: 'Include Fields',
						}),
				  }
				: {}),
			...(p.limit !== undefined ? { limit: p.limit } : {}),
			...(p.paginationToken !== undefined ? { paginationToken: p.paginationToken } : {}),
		});
	},
});
