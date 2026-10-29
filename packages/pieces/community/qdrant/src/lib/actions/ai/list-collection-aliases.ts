import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantListAliasesOutputSchema } from '../../output-schemas';

export const listCollectionAliasesAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_list_collection_aliases',
	outputSchema: qdrantListAliasesOutputSchema,
	displayName: 'List Collection Aliases',
	description: 'Lists the aliases of a collection.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'List the aliases that point to one collection.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.listCollectionAliases({
			auth,
			collectionName: propsValue.collectionName,
		});
	},
});
