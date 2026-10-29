import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantGetCollectionOutputSchema } from '../../output-schemas';

export const getCollectionAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_get_collection',
	outputSchema: qdrantGetCollectionOutputSchema,
	displayName: 'Get Collection',
	description: 'Gets the configuration and status of a collection.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Get one collection's configuration and status: vector size and distance (or named vectors), point count, indexing status and payload schema (indexed fields). Use before writing to learn the vector sizes and names the collection expects.",
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.getCollection({ auth, collectionName: propsValue.collectionName });
	},
});
