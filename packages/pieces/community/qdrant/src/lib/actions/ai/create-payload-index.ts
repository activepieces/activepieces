import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const createPayloadIndexAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_create_payload_index',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Create Payload Index',
	description: 'Creates an index on a payload field.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Create an index on a payload field so filters, Facet Payload and ordering on it are fast; collections in strict mode only filter on indexed fields. Waits until the index is built. Creating an index that already exists with the same type is a no-op.',
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'Payload key to index; nested keys use dots, e.g. "metadata.city".',
			required: true,
		}),
		fieldSchema: Property.StaticDropdown({
			displayName: 'Field Type',
			description: 'Type of the values stored in the field.',
			required: true,
			options: {
				options: [
					{ label: 'Keyword', value: 'keyword' },
					{ label: 'Integer', value: 'integer' },
					{ label: 'Float', value: 'float' },
					{ label: 'Boolean', value: 'bool' },
					{ label: 'Geo', value: 'geo' },
					{ label: 'Datetime', value: 'datetime' },
					{ label: 'Full Text', value: 'text' },
					{ label: 'UUID', value: 'uuid' },
				],
			},
		}),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.createPayloadIndex({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				field_name: propsValue.fieldName,
				field_schema: propsValue.fieldSchema,
			},
		});
	},
});
