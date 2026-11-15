import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const upsertPointsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_upsert_points',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Upsert Points',
	description: 'Inserts points or replaces points with the same ID.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Insert points, or fully replace the vector and payload of points with the same id. The collection must already exist (Create Collection) and vectors must match its sizes and names. Waits until applied. Repeating with the same ids converges on the same state.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		points: Property.Array({
			displayName: 'Points',
			description:
				'Points as a JSON array of objects with id (unsigned integer or UUID), vector and optional payload, e.g. [{"id": 1, "vector": [0.1, 0.2, 0.3], "payload": {"city": "London"}}]. For named vectors, vector is a map: {"text": [0.1, 0.2]}.',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.upsertPoints({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				points: qdrantUtils.requireItems({ items: propsValue.points, propName: 'Points' }),
			},
		});
	},
});
