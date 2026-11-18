import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeGetImportOutputSchema } from '../../output-schemas';

export const pineconeGetImportAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_import',
	outputSchema: pineconeGetImportOutputSchema,
	displayName: 'Get Import',
	description: 'Gets the status of one bulk import.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one bulk import by ID, once: status, percent complete, records imported and any error. Use it to poll an import started with Start Import.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		importId: Property.ShortText({
			displayName: 'Import ID',
			description: 'Import operation ID, from Start Import or List Imports.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const index = client.index({ name: p.indexName });
		return await index.describeImport(p.importId);
	},
});
