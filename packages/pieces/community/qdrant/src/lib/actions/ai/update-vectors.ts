import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const updateVectorsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_update_vectors',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Update Vectors',
	description: 'Replaces the vectors of existing points.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replace the vectors of existing points; payloads stay, and for named vectors only the names you send change. The points must already exist (Upsert Points creates them).',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		points: Property.Array({
			displayName: 'Points',
			description:
				'JSON array of {id, vector}. vector is an array of numbers, or a map of vector name to values for named vectors, e.g. [{"id": 1, "vector": {"text": [0.1, 0.2]}}].',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.updateVectors({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				points: qdrantUtils.requireItems({ items: propsValue.points, propName: 'Points' }),
			},
		});
	},
});
