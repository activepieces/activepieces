import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeCancelImportOutputSchema } from '../../output-schemas';

export const pineconeCancelImportAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_cancel_import',
	outputSchema: pineconeCancelImportOutputSchema,
	displayName: 'Cancel Import',
	description: 'Cancels a running bulk import.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Cancels a bulk import that has not finished. Records already imported stay in the index.',
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
		await index.cancelImport(p.importId);
		return { cancelled: true, importId: p.importId };
	},
});
