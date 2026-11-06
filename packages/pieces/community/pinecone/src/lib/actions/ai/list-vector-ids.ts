import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeListVectorIdsOutputSchema } from '../../output-schemas';

export const pineconeListVectorIdsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_vector_ids',
	outputSchema: pineconeListVectorIdsOutputSchema,
	displayName: 'List Vector IDs',
	description: 'Lists the record IDs in a namespace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists record IDs in a namespace of a serverless vectors index, optionally only IDs starting with a prefix, one page at a time. Pass the returned pagination token with the same prefix for the next page.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		prefix: Property.ShortText({
			displayName: 'ID Prefix',
			description: 'Only list IDs that start with this text, e.g. "doc1#".',
			required: false,
		}),
		limit: pineconeAiProps.limit({
			required: false,
			description: 'Maximum number of items to return, 1-100. Defaults to 100.',
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
		return await index.listPaginated({
			...(p.prefix !== undefined ? { prefix: p.prefix } : {}),
			...(p.limit !== undefined ? { limit: p.limit } : {}),
			...(p.paginationToken !== undefined ? { paginationToken: p.paginationToken } : {}),
		});
	},
});
