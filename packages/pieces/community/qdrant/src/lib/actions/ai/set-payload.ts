import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const setPayloadAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_set_payload',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Set Payload',
	description: 'Sets payload keys on points.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Set payload keys on the points selected by exactly one of Point IDs or Filter. Only the given keys change; other keys stay. Use Overwrite Payload to replace the whole payload.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		payload: qdrantAiProps.payload({ required: true }),
		nestedKey: qdrantAiProps.nestedKey({ required: false }),
		pointIds: qdrantAiProps.pointIds({ required: false }),
		filter: qdrantAiProps.filter({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.setPayload({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				payload: propsValue.payload,
				key: propsValue.nestedKey,
				...qdrantUtils.pointsSelector({ pointIds: propsValue.pointIds, filter: propsValue.filter }),
			},
		});
	},
});
