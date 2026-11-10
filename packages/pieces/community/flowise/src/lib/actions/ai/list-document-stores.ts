import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseListDocumentStoresOutputSchema } from '../../output-schemas';

export const listDocumentStoresAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_document_stores',
	outputSchema: flowiseListDocumentStoresOutputSchema,
	displayName: 'List Document Stores',
	description: 'Lists the document stores in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the document stores (knowledge bases) in the workspace with their ids, names, status and loaders. Returns the Document Store ID the other document store actions take.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const documentStores = await flowiseApi.listDocumentStores({ auth: context.auth });
		return { documentStores, count: documentStores.length };
	},
});
