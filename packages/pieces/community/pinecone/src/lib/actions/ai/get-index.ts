import { createAction } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeGetIndexOutputSchema } from '../../output-schemas';

export const pineconeGetIndexAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_index',
	outputSchema: pineconeGetIndexOutputSchema,
	displayName: 'Get Index',
	description: 'Gets one index by name.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one index by its exact name: host, readiness status, deployment, schema, read capacity, tags and deletion protection. Use it to check an index is ready before writing to it.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
	},
	async run(context) {
		const client = pineconeClient.create({ auth: context.auth });
		return await client.indexes.describe(context.propsValue.indexName);
	},
});
