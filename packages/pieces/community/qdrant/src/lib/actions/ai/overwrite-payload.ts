import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const overwritePayloadAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_overwrite_payload',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Overwrite Payload',
	description: 'Replaces the whole payload of points.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replace the entire payload of the points selected by exactly one of Point IDs or Filter; keys not in the new payload are removed. Use Set Payload to change only some keys.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		payload: qdrantAiProps.payload({ required: true }),
		pointIds: qdrantAiProps.pointIds({ required: false }),
		filter: qdrantAiProps.filter({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.overwritePayload({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				payload: propsValue.payload,
				...qdrantUtils.pointsSelector({ pointIds: propsValue.pointIds, filter: propsValue.filter }),
			},
		});
	},
});
