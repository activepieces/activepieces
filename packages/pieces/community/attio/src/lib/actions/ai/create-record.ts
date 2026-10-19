import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { AttioRecordResponse } from '../../common/types';
import { attioCreateRecordOutputSchema } from '../../output-schemas';

export const attioCreateRecordAction = createAction({
	auth: attioAuth,
	name: 'attio_create_record',
	outputSchema: attioCreateRecordOutputSchema,
	displayName: 'Create Record',
	description: 'Creates a record in any Attio object.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a new record (person, company, deal or custom object) with the given attribute values. Use Upsert Record instead when the record may already exist. Not idempotent: each call creates a separate record.',
		idempotent: false,
	},
	props: {
		object: attioAi.objectProp(),
		values: attioAi.valuesProp({
			displayName: 'Values',
			description: 'Attribute values keyed by attribute slug, e.g. {"name": "Acme", "domains": ["acme.com"]}. Use List Attributes for slugs and types.',
			required: true,
		}),
	},
	async run(context) {
		const { object, values } = context.propsValue;
		const response = await attioApiCall<{ data: AttioRecordResponse }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/objects/${object}/records`,
			body: { data: { values } },
		});
		return attioAi.flattenRecord(response.data);
	},
});
