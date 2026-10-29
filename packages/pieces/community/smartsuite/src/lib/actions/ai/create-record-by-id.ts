import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../../auth';
import { SmartSuiteRecord } from '../../common';
import { smartSuiteClient } from '../../common/client';
import { smartSuiteInputs } from '../../common/inputs';
import { outputSchemas } from '../../output-schemas';

export const createRecordByIdAi = createAction({
	name: 'create_record_by_id',
	classification: 'WRITE',
	displayName: 'Create Record (by Table ID)',
	description: 'Creates a record from a JSON object keyed by field slug.',
	audience: 'ai',
	aiMetadata: {
		description: 'Creates one SmartSuite record. Fields is a JSON object keyed by field slug, in SmartSuite\'s value format: text/number as plain values, single select as the choice value, status as {"value":"<choice>"}, date as {"date":"2026-10-12T00:00:00Z","include_time":false}, linked records/users as arrays of IDs, emails and links as arrays of strings. Get slugs and choice values from Get Table Schema (by ID). Returns the created record with its id. Not idempotent: each call creates another record.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		fields: Property.Json({
			displayName: 'Fields',
			description: 'JSON object keyed by field slug, for example {"title": "New task", "priority": "high"}.',
			required: true,
		}),
	},
	outputSchema: outputSchemas['rawRecord'],
	async run({ auth, propsValue }) {
		const fields = smartSuiteInputs.requireObject({ value: propsValue.fields, label: 'Fields' });
		return smartSuiteClient.request<SmartSuiteRecord>({
			credentials: smartSuiteClient.credentialsOf(auth),
			method: HttpMethod.POST,
			path: `/applications/${smartSuiteClient.pathSegment({ value: propsValue.tableId, label: 'Table ID' })}/records/`,
			body: fields,
			operation: 'create record',
		});
	},
});
