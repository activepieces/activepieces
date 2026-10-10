import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseUpdateDocumentStoreOutputSchema } from '../../output-schemas';

export const updateDocumentStoreAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_update_document_store',
	outputSchema: flowiseUpdateDocumentStoreOutputSchema,
	displayName: 'Update Document Store',
	description: 'Renames a document store or changes its description.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the name or description of a document store. Fields left empty stay as they are.',
		idempotent: true,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', description: 'New name.', required: false }),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New description.',
			required: false,
		}),
	},
	async run(context) {
		const { storeId, name, description } = context.propsValue;
		return await flowiseApi.updateDocumentStore({
			auth: context.auth,
			storeId,
			fields: { name, description },
		});
	},
});
