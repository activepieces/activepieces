import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { AttioRecordResponse } from '../../common/types';
import { attioCreateRecordOutputSchema } from '../../output-schemas';

export const attioOverwriteRecordAction = createAction({
	auth: attioAuth,
	name: 'attio_overwrite_record',
	outputSchema: attioCreateRecordOutputSchema,
	displayName: 'Overwrite Record',
	description: 'Updates attribute values on a record, replacing multiselect attributes.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates the supplied attribute values on a record, replacing (not appending to) multiselect values. Attributes not supplied are left untouched. Use Update Record to append instead.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp(),
		values: attioAi.valuesProp({
			displayName: 'Values',
			description: 'Attribute values keyed by attribute slug, e.g. {"name": "Acme", "domains": ["acme.com"]}. Use List Attributes for slugs and types.',
			required: true,
		}),
	},
	async run(context) {
		const { object, record_id, values } = context.propsValue;
		const response = await attioApiCall<{ data: AttioRecordResponse }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/objects/${object}/records/${record_id}`,
			body: { data: { values } },
		});
		return attioAi.flattenRecord(response.data);
	},
});
