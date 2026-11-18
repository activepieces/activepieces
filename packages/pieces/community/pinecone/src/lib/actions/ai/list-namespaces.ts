import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeListNamespacesOutputSchema } from '../../output-schemas';

export const pineconeListNamespacesAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_namespaces',
	outputSchema: pineconeListNamespacesOutputSchema,
	displayName: 'List Namespaces',
	description: 'Lists the namespaces in an index.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the namespaces of an index with their record counts, optionally only names starting with a prefix, one page at a time. Pass the returned pagination token with the same prefix for the next page.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		prefix: Property.ShortText({
			displayName: 'Name Prefix',
			description: 'Only list namespaces whose name starts with this text.',
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
		const index = client.index({ name: p.indexName });
		return await index.listNamespaces({
			...(p.limit !== undefined ? { limit: p.limit } : {}),
			...(p.paginationToken !== undefined ? { paginationToken: p.paginationToken } : {}),
			...(p.prefix !== undefined ? { prefix: p.prefix } : {}),
		});
	},
});
