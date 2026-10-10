import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseUpdateDocumentStoreOutputSchema } from '../../output-schemas';

export const deleteDocumentLoaderAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_document_loader',
	outputSchema: flowiseUpdateDocumentStoreOutputSchema,
	displayName: 'Delete Document Loader',
	description: 'Permanently deletes a document loader and its chunks.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one document loader and all its chunks from a document store. This cannot be undone.',
		idempotent: false,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		loaderId: flowiseAiProps.loaderId({ required: true }),
	},
	async run(context) {
		const { storeId, loaderId } = context.propsValue;
		return await flowiseApi.deleteDocumentLoader({ auth: context.auth, storeId, loaderId });
	},
});
