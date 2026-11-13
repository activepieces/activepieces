import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseDocumentStoreOutputSchema } from '../../output-schemas';

export const getDocumentStoreAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_get_document_store',
	outputSchema: flowiseDocumentStoreOutputSchema,
	displayName: 'Get Document Store',
	description: 'Gets one document store by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one document store by ID, including its loaders (each with the Loader ID that the chunk and loader actions take), status and vector store, embedding and record manager config.',
		idempotent: true,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
	},
	async run(context) {
		return await flowiseApi.getDocumentStore({
			auth: context.auth,
			storeId: context.propsValue.storeId,
		});
	},
});
