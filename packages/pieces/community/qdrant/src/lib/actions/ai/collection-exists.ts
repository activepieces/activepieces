import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantCollectionExistsOutputSchema } from '../../output-schemas';

export const collectionExistsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_collection_exists',
	outputSchema: qdrantCollectionExistsOutputSchema,
	displayName: 'Collection Exists',
	description: 'Checks whether a collection exists.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Check whether a collection with the given name exists, returning exists true or false instead of failing. Use before Create Collection, which fails on an existing name.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.collectionExists({ auth, collectionName: propsValue.collectionName });
	},
});
