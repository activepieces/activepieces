import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantScrollPointsOutputSchema } from '../../output-schemas';

export const scrollPointsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_scroll_points',
	outputSchema: qdrantScrollPointsOutputSchema,
	displayName: 'Scroll Points',
	description: 'Lists points page by page, optionally filtered by payload.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Page through points in id order, optionally narrowed by a payload filter, without vector similarity (use Query Points for that). Returns next_page_offset: pass it as Offset with the same filter to get the next page; null means there are no more pages.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		filter: qdrantAiProps.filter({ required: false }),
		limit: qdrantAiProps.limit({ required: false }),
		offset: Property.ShortText({
			displayName: 'Offset',
			description:
				'next_page_offset from a previous Scroll Points call, to get the next page. Leave empty for the first page.',
			required: false,
		}),
		withPayload: qdrantAiProps.withPayload({ required: false }),
		withVector: qdrantAiProps.withVector({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.scrollPoints({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				filter: propsValue.filter,
				limit: propsValue.limit,
				offset: propsValue.offset ? qdrantUtils.parsePointId({ id: propsValue.offset }) : undefined,
				with_payload: propsValue.withPayload ?? true,
				with_vector: propsValue.withVector,
			},
		});
	},
});
