import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { AttioRecordResponse } from '../../common/types';
import { attioCreateRecordOutputSchema } from '../../output-schemas';

export const attioUpsertRecordAction = createAction({
	auth: attioAuth,
	name: 'attio_upsert_record',
	outputSchema: attioCreateRecordOutputSchema,
	displayName: 'Upsert Record',
	description: 'Creates a record, or updates it if one matches a unique attribute.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a record or updates the existing one whose unique matching attribute (e.g. `email_addresses` for people, `domains` for companies) equals the supplied value. Prefer this over Create Record to avoid duplicates. Multiselect values are added to existing ones.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		matching_attribute: Property.ShortText({
			displayName: 'Matching Attribute',
			description: 'Slug or ID of a unique attribute used to find an existing record, e.g. `email_addresses` or `domains`. Its value must be included in Values.',
			required: true,
		}),
		values: attioAi.valuesProp({
			displayName: 'Values',
			description: 'Attribute values keyed by attribute slug, e.g. {"name": "Acme", "domains": ["acme.com"]}. Use List Attributes for slugs and types.',
			required: true,
		}),
	},
	async run(context) {
		const { object, matching_attribute, values } = context.propsValue;
		const response = await attioApiCall<{ data: AttioRecordResponse }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/objects/${object}/records`,
			query: { matching_attribute },
			body: { data: { values } },
		});
		return attioAi.flattenRecord(response.data);
	},
});
