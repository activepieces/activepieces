import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const deletePayloadIndexAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_delete_payload_index',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Delete Payload Index',
	description: 'Deletes the index on a payload field.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Delete the index on a payload field. The payload values stay; only the index is removed.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description:
				'Indexed payload key, e.g. "metadata.city". Get Collection lists indexed fields under payload_schema.',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.deletePayloadIndex({
			auth,
			collectionName: propsValue.collectionName,
			fieldName: propsValue.fieldName,
		});
	},
});
