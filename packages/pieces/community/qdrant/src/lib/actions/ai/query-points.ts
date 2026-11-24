import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantQueryPointsOutputSchema } from '../../output-schemas';

export const queryPointsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_query_points',
	outputSchema: qdrantQueryPointsOutputSchema,
	displayName: 'Query Points',
	description: 'Finds the points most similar to a vector or point.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Find the points most similar to a vector or to an existing point, on the unnamed or a named vector, optionally filtered by payload. Also runs hybrid search by fusing Prefetch sub-queries. Use Scroll Points to list by filter only.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		query: qdrantAiProps.query({ required: false }),
		using: qdrantAiProps.using({ required: false }),
		prefetch: Property.Json({
			displayName: 'Prefetch',
			description:
				'Sub-queries run first, whose results Query then ranks; needed for fusion, e.g. [{"query": [0.1, 0.2], "using": "text", "limit": 20}, {"query": [0.3, 0.4], "using": "image", "limit": 20}].',
			required: false,
		}),
		filter: qdrantAiProps.filter({ required: false }),
		limit: qdrantAiProps.limit({ required: false }),
		scoreThreshold: Property.Number({
			displayName: 'Score Threshold',
			description:
				'Only return points scoring at least this; for Euclidean distance, at most this.',
			required: false,
		}),
		withPayload: qdrantAiProps.withPayload({ required: false }),
		withVector: qdrantAiProps.withVector({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.queryPoints({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				query: propsValue.query,
				using: propsValue.using,
				prefetch: propsValue.prefetch,
				filter: propsValue.filter,
				limit: propsValue.limit,
				score_threshold: propsValue.scoreThreshold,
				with_payload: propsValue.withPayload ?? true,
				with_vector: propsValue.withVector,
			},
		});
	},
});
