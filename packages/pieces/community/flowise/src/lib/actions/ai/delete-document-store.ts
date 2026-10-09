import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseDeleteDocumentStoreOutputSchema } from '../../output-schemas';

export const deleteDocumentStoreAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_document_store',
	outputSchema: flowiseDeleteDocumentStoreOutputSchema,
	displayName: 'Delete Document Store',
	description: 'Permanently deletes a document store.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a document store with its loaders and chunks. This cannot be undone.',
		idempotent: false,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
	},
	async run(context) {
		return await flowiseApi.deleteDocumentStore({
			auth: context.auth,
			storeId: context.propsValue.storeId,
		});
	},
});
