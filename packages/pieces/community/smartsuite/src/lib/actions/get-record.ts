import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, transformRecordFields } from '../common/props';
import { smartSuiteApi, SmartSuiteRecord } from '../common';
import { smartSuiteClient } from '../common/client';
import { outputSchemas } from '../output-schemas';

export const getRecord = createAction({
	name: 'get_record',
	classification: 'READ',
	displayName: 'Get a Record',
	description: 'Retrieves a specific record by ID',
	audience: 'human',
	aiMetadata: {
		description: 'Fetches a single SmartSuite record by its record ID, with fields keyed by their table label (for example "Title", "Status"). Agents should use Get Record (by ID), which returns values keyed by field slug. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
	},
	outputSchema: outputSchemas['labelledRecord'],
	async run({ auth, propsValue }) {
		const { tableId, recordId } = propsValue;
		const credentials = smartSuiteClient.credentialsOf(auth);
		const recordPath = `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/${smartSuiteClient.pathSegment({ value: recordId, label: 'Record ID' })}/`;
		const table = await smartSuiteApi.getTable({ credentials, tableId });
		const response = await smartSuiteClient.request<SmartSuiteRecord>({
			credentials,
			method: HttpMethod.GET,
			path: recordPath,
			operation: 'get record',
		});
		return transformRecordFields({ tableSchema: table.structure, tableValues: response });
	},
});
