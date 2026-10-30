import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, formatRecordFields, transformRecordFields } from '../common/props';
import { smartSuiteApi, SmartSuiteRecord } from '../common';
import { smartSuiteClient } from '../common/client';
import { outputSchemas } from '../output-schemas';

export const updateRecord = createAction({
	name: 'update_record',
	classification: 'WRITE',
	displayName: 'Update a Record',
	description: 'Updates an existing record in the specified table',
	audience: 'human',
	aiMetadata: {
		description: 'Patches an existing SmartSuite record using form fields built from the table schema; only filled-in fields are sent and the output is keyed by field label. Agents should use Update Record Fields (by ID) instead. Idempotent: re-applying the same values leaves the record unchanged.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
		fields: smartsuiteCommon.tableFields,
	},
	outputSchema: outputSchemas['labelledRecord'],
	async run({ auth, propsValue }) {
		const { tableId, recordId, fields } = propsValue;
		const credentials = smartSuiteClient.credentialsOf(auth);
		const recordPath = `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/${smartSuiteClient.pathSegment({ value: recordId, label: 'Record ID' })}/`;
		const table = await smartSuiteApi.getTable({ credentials, tableId });
		const response = await smartSuiteClient.request<SmartSuiteRecord>({
			credentials,
			method: HttpMethod.PATCH,
			path: recordPath,
			body: formatRecordFields({ tableSchema: table.structure, tableValues: fields ?? {} }),
			operation: 'update record',
		});
		return transformRecordFields({ tableSchema: table.structure, tableValues: response });
	},
});
