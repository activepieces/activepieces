import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantApi } from '../../common/api';
import { qdrantListAliasesOutputSchema } from '../../output-schemas';

export const listAliasesAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_list_aliases',
	outputSchema: qdrantListAliasesOutputSchema,
	displayName: 'List Aliases',
	description: 'Lists all aliases and the collections they point to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List every alias in the instance with the collection it points to. An alias works wherever a collection name is accepted.',
		idempotent: true,
	},
	props: {},
	run: async ({ auth }) => {
		return await qdrantApi.listAliases({ auth });
	},
});
