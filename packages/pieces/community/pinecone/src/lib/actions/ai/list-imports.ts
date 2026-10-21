import { createAction } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeListImportsOutputSchema } from '../../output-schemas';

export const pineconeListImportsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_imports',
	outputSchema: pineconeListImportsOutputSchema,
	displayName: 'List Imports',
	description: 'Lists the bulk imports of an index.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the recent bulk imports of an index with status and progress, one page at a time. Pass the returned pagination token for the next page.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
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
		return await index.listImports(p.limit, p.paginationToken);
	},
});
