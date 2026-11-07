import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantApi } from '../../common/api';
import { qdrantListCollectionsOutputSchema } from '../../output-schemas';

export const listCollectionsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_list_collections',
	outputSchema: qdrantListCollectionsOutputSchema,
	displayName: 'List Collections',
	description: 'Lists all collections in the Qdrant instance.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List the names of all collections in the connected Qdrant instance. Use first to find the collection name every other action needs. Read-only.',
		idempotent: true,
	},
	props: {},
	run: async ({ auth }) => {
		return await qdrantApi.listCollections({ auth });
	},
});
