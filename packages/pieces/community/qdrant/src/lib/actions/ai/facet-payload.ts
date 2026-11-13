import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantFacetPayloadOutputSchema } from '../../output-schemas';

export const facetPayloadAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_facet_payload',
	outputSchema: qdrantFacetPayloadOutputSchema,
	displayName: 'Facet Payload',
	description: 'Counts the points per distinct value of a payload field.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Count how many points have each distinct value of a payload field, optionally within a filter, e.g. points per category. The field needs a keyword, integer, boolean or UUID payload index (Create Payload Index).',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		key: Property.ShortText({
			displayName: 'Field Name',
			description: 'Payload field to count the values of, e.g. "category".',
			required: true,
		}),
		filter: qdrantAiProps.filter({ required: false }),
		limit: qdrantAiProps.limit({
			required: false,
			description: 'Maximum number of distinct values to return. Defaults to 10.',
		}),
		exact: Property.Checkbox({
			displayName: 'Exact',
			description: 'Count exactly; slower on large collections. Defaults to false.',
			required: false,
			defaultValue: false,
		}),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.facet({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				key: propsValue.key,
				filter: propsValue.filter,
				limit: propsValue.limit,
				exact: propsValue.exact,
			},
		});
	},
});
