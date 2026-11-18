import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantCountPointsOutputSchema } from '../../output-schemas';

export const countPointsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_count_points',
	outputSchema: qdrantCountPointsOutputSchema,
	displayName: 'Count Points',
	description: 'Counts the points in a collection.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Count the points in a collection, optionally only those matching a payload filter.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		filter: qdrantAiProps.filter({ required: false }),
		exact: Property.Checkbox({
			displayName: 'Exact',
			description: 'Count exactly. Set false for a faster estimate. Defaults to true.',
			required: false,
			defaultValue: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.countPoints({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				filter: propsValue.filter,
				exact: propsValue.exact,
			},
		});
	},
});
