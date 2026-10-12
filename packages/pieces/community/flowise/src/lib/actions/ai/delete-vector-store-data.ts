import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';

export const deleteVectorStoreDataAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_vector_store_data',
	displayName: 'Delete Vector Store Data',
	description: 'Deletes the data a document store upserted into its vector store.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes the vectors a document store upserted. Only data upserted with a record manager configured is removed; other data stays. The store and its chunks are kept.',
		idempotent: false,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
	},
	async run(context) {
		return await flowiseApi.deleteVectorStoreData({
			auth: context.auth,
			storeId: context.propsValue.storeId,
		});
	},
});
