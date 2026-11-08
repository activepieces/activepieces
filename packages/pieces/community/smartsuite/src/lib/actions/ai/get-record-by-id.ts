import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../../auth';
import { SmartSuiteRecord } from '../../common';
import { smartSuiteClient } from '../../common/client';
import { smartSuiteInputs } from '../../common/inputs';
import { outputSchemas } from '../../output-schemas';

export const getRecordByIdAi = createAction({
	name: 'get_record_by_id',
	classification: 'READ',
	displayName: 'Get Record (by ID)',
	description: 'Gets one record by table ID and record ID, keyed by field slug.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns one SmartSuite record with values keyed by field slug (the same keys you pass to create or update). Needs the Table ID (List Tables (by ID)) and Record ID (List Records). Next: Update Record Fields to change it, List Comments (by ID) for its discussion, or Get File Download URL (by Handle) for file handles. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		recordId: smartSuiteInputs.aiProps.recordId(),
	},
	outputSchema: outputSchemas['rawRecord'],
	async run({ auth, propsValue }) {
		return smartSuiteClient.request<SmartSuiteRecord>({
			credentials: smartSuiteClient.credentialsOf(auth),
			method: HttpMethod.GET,
			path: `/applications/${smartSuiteClient.pathSegment({ value: propsValue.tableId, label: 'Table ID' })}/records/${smartSuiteClient.pathSegment({ value: propsValue.recordId, label: 'Record ID' })}/`,
			operation: 'get record',
		});
	},
});
