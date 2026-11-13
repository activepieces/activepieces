import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseRefreshDocumentStoreOutputSchema } from '../../output-schemas';

export const refreshDocumentStoreAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_refresh_document_store',
	outputSchema: flowiseRefreshDocumentStoreOutputSchema,
	displayName: 'Refresh Document Store',
	description: 'Re-processes and re-upserts every document in a document store.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Re-runs every loader of a document store and upserts the result into its vector store, e.g. after the source content changed. Returns one upsert result per loader.',
		idempotent: false,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		items: Property.Json({
			displayName: 'Loader Overrides',
			description:
				'Optional array of per-loader configs to use instead of the saved ones, in the Upsert Document format.',
			required: false,
		}),
	},
	async run(context) {
		const { storeId, items } = context.propsValue;
		return await flowiseApi.refreshDocumentStore({ auth: context.auth, storeId, items });
	},
});
