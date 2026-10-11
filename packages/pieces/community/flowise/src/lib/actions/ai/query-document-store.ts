import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseQueryDocumentStoreOutputSchema } from '../../output-schemas';

export const queryDocumentStoreAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_query_document_store',
	outputSchema: flowiseQueryDocumentStoreOutputSchema,
	displayName: 'Query Document Store',
	description: 'Runs a retrieval query against a document store.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Runs a semantic retrieval query against the vector store of a document store and returns the matching chunks. The store must have been upserted first.',
		idempotent: true,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		query: Property.LongText({
			displayName: 'Query',
			description: 'The text to search for.',
			required: true,
		}),
	},
	async run(context) {
		const { storeId, query } = context.propsValue;
		return await flowiseApi.queryDocumentStore({ auth: context.auth, storeId, query });
	},
});
