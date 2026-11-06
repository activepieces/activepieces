import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeFetchVectorsByMetadataOutputSchema } from '../../output-schemas';

export const pineconeFetchVectorsByMetadataAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_fetch_vectors_by_metadata',
	outputSchema: pineconeFetchVectorsByMetadataOutputSchema,
	displayName: 'Fetch Vectors by Metadata',
	description: 'Gets vector records whose metadata matches a filter.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets vector records whose metadata matches a filter, one page at a time, without a query vector. Pass the returned pagination token with the same filter for the next page.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		filter: Property.Json({
			displayName: 'Metadata Filter',
			description: 'Metadata filter, e.g. {"genre": {"$eq": "drama"}, "year": {"$gte": 2020}}.',
			required: true,
		}),
		limit: pineconeAiProps.limit({
			required: false,
			description: 'Maximum number of items to return, 1-10000. Defaults to 100.',
		}),
		paginationToken: pineconeAiProps.paginationToken({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const index = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		});
		return await index.fetchByMetadata({
			filter: p.filter,
			...(p.limit !== undefined ? { limit: p.limit } : {}),
			...(p.paginationToken !== undefined ? { paginationToken: p.paginationToken } : {}),
		});
	},
});
