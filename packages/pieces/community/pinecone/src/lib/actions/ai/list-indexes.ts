import { createAction } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeListIndexesOutputSchema } from '../../output-schemas';

export const pineconeListIndexesAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_indexes',
	outputSchema: pineconeListIndexesOutputSchema,
	displayName: 'List Indexes',
	description: 'Lists every index in the Pinecone project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every index in the connected Pinecone project with its name, host, status, deployment and schema. Use it to find the index name that other actions take.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const client = pineconeClient.create({ auth: context.auth });
		return await client.indexes.list();
	},
});
