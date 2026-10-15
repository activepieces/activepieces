import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseCreateDocumentStoreOutputSchema } from '../../output-schemas';

export const createDocumentStoreAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_document_store',
	outputSchema: flowiseCreateDocumentStoreOutputSchema,
	displayName: 'Create Document Store',
	description: 'Creates an empty document store.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an empty document store. Add documents to it with Upsert Document. Each call creates another store.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the document store.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'What the store contains.',
			required: false,
		}),
	},
	async run(context) {
		const { name, description } = context.propsValue;
		return await flowiseApi.createDocumentStore({
			auth: context.auth,
			fields: { name, description },
		});
	},
});
