import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, formatRecordFields, transformRecordFields } from '../common/props';
import { smartSuiteApi, SmartSuiteRecord } from '../common';
import { smartSuiteClient } from '../common/client';
import { outputSchemas } from '../output-schemas';

export const createRecord = createAction({
	name: 'create_record',
	classification: 'WRITE',
	displayName: 'Create a Record',
	description: 'Creates a new record in the specified table.',
	audience: 'human',
	aiMetadata: {
		description: 'Adds a new record (row) to a SmartSuite table using form fields built from the table schema; the output is keyed by field label. Agents should use Create Record (by Table ID) instead. Not idempotent: each call creates a separate record.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		fields: smartsuiteCommon.tableFields,
	},
	outputSchema: outputSchemas['labelledRecord'],
	async run({ auth, propsValue }) {
		const { tableId, fields } = propsValue;
		const credentials = smartSuiteClient.credentialsOf(auth);
		const table = await smartSuiteApi.getTable({ credentials, tableId });
		const response = await smartSuiteClient.request<SmartSuiteRecord>({
			credentials,
			method: HttpMethod.POST,
			path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/`,
			body: formatRecordFields({ tableSchema: table.structure, tableValues: fields ?? {} }),
			operation: 'create record',
		});
		return transformRecordFields({ tableSchema: table.structure, tableValues: response });
	},
});
