import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantQueryPointsGroupsOutputSchema } from '../../output-schemas';

export const queryPointsGroupsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_query_points_groups',
	outputSchema: qdrantQueryPointsGroupsOutputSchema,
	displayName: 'Query Points Groups',
	description: 'Finds the most similar points, grouped by a payload field.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Like Query Points, but returns the best matches grouped by a payload field (e.g. the top chunks per document), so one group cannot fill all the results.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		query: qdrantAiProps.query({ required: false }),
		using: qdrantAiProps.using({ required: false }),
		groupBy: Property.ShortText({
			displayName: 'Group By',
			description: 'Payload field to group results by, e.g. "document_id".',
			required: true,
		}),
		groupSize: Property.Number({
			displayName: 'Group Size',
			description: 'Maximum points per group. Defaults to 3.',
			required: false,
		}),
		filter: qdrantAiProps.filter({ required: false }),
		limit: qdrantAiProps.limit({
			required: false,
			description: 'Maximum number of groups to return. Defaults to 10.',
		}),
		withPayload: qdrantAiProps.withPayload({ required: false }),
		withVector: qdrantAiProps.withVector({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.queryPointsGroups({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				query: propsValue.query,
				using: propsValue.using,
				group_by: propsValue.groupBy,
				group_size: propsValue.groupSize,
				filter: propsValue.filter,
				limit: propsValue.limit,
				with_payload: propsValue.withPayload ?? true,
				with_vector: propsValue.withVector,
			},
		});
	},
});
