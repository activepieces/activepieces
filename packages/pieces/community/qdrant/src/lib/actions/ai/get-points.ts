import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantGetPointsOutputSchema } from '../../output-schemas';

export const getPointsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_get_points',
	outputSchema: qdrantGetPointsOutputSchema,
	displayName: 'Get Points',
	description: 'Gets points by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Get points by id with their payload and, optionally, vectors. Ids that do not exist are left out of the result instead of failing.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		pointIds: qdrantAiProps.pointIds({ required: true }),
		withPayload: qdrantAiProps.withPayload({ required: false }),
		withVector: qdrantAiProps.withVector({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		const points = await qdrantApi.getPoints({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				ids: qdrantUtils
					.requireItems({ items: propsValue.pointIds, propName: 'Point IDs' })
					.map((id) => qdrantUtils.parsePointId({ id })),
				with_payload: propsValue.withPayload ?? true,
				with_vector: propsValue.withVector,
			},
		});
		return { points, count: points.length };
	},
});
