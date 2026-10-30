import { createAction } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeDeleteIndexOutputSchema } from '../../output-schemas';

export const pineconeDeleteIndexAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_delete_index',
	outputSchema: pineconeDeleteIndexOutputSchema,
	displayName: 'Delete Index',
	description: 'Permanently deletes an index and all of its data.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an index and every record in it; this cannot be undone. Fails while deletion protection is enabled (turn it off with Configure Index first).',
		idempotent: false,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
	},
	async run(context) {
		const { indexName } = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		await client.indexes.delete(indexName);
		return { deleted: true, indexName };
	},
});
