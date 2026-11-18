import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const deletePayloadKeysAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_delete_payload_keys',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Delete Payload Keys',
	description: 'Removes payload keys from points.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Remove the given payload keys from the points selected by exactly one of Point IDs or Filter. Other keys and the vectors stay.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		keys: Property.Array({
			displayName: 'Keys',
			description: 'Payload keys to remove, e.g. ["status", "metadata.city"].',
			required: true,
		}),
		pointIds: qdrantAiProps.pointIds({ required: false }),
		filter: qdrantAiProps.filter({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.deletePayloadKeys({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				keys: qdrantUtils.requireItems({ items: propsValue.keys, propName: 'Keys' }),
				...qdrantUtils.pointsSelector({ pointIds: propsValue.pointIds, filter: propsValue.filter }),
			},
		});
	},
});
