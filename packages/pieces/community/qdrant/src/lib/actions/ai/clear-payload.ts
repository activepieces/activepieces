import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const clearPayloadAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_clear_payload',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Clear Payload',
	description: 'Removes the whole payload from points.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Remove the entire payload from the points selected by exactly one of Point IDs or Filter. The vectors stay.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		pointIds: qdrantAiProps.pointIds({ required: false }),
		filter: qdrantAiProps.filter({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.clearPayload({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				...qdrantUtils.pointsSelector({ pointIds: propsValue.pointIds, filter: propsValue.filter }),
			},
		});
	},
});
