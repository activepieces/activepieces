import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../../auth';
import { SmartSuiteRecord } from '../../common';
import { smartSuiteClient } from '../../common/client';
import { smartSuiteInputs } from '../../common/inputs';
import { outputSchemas } from '../../output-schemas';

export const updateRecordFieldsAi = createAction({
	name: 'update_record_fields',
	classification: 'WRITE',
	displayName: 'Update Record Fields (by ID)',
	description: 'Updates only the fields given in a JSON object keyed by field slug.',
	audience: 'ai',
	aiMetadata: {
		description: 'Patches one SmartSuite record. Only the slugs present in Fields are changed; omitted fields keep their value. To clear a field send its empty value ("" for text, [] for lists, null for single values). Same value format as Create Record (by Table ID). Returns the updated record. Idempotent: sending the same fields again leaves the record unchanged.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		recordId: smartSuiteInputs.aiProps.recordId(),
		fields: Property.Json({
			displayName: 'Fields',
			description: 'JSON object keyed by field slug with the new values.',
			required: true,
		}),
	},
	outputSchema: outputSchemas['rawRecord'],
	async run({ auth, propsValue }) {
		const fields = smartSuiteInputs.requireObject({ value: propsValue.fields, label: 'Fields' });
		if (Object.keys(fields).length === 0) {
			throw new Error('Fields must contain at least one field slug to update.');
		}
		return smartSuiteClient.request<SmartSuiteRecord>({
			credentials: smartSuiteClient.credentialsOf(auth),
			method: HttpMethod.PATCH,
			path: `/applications/${smartSuiteClient.pathSegment({ value: propsValue.tableId, label: 'Table ID' })}/records/${smartSuiteClient.pathSegment({ value: propsValue.recordId, label: 'Record ID' })}/`,
			body: fields,
			operation: 'update record',
		});
	},
});
