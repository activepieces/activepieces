import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { SmartSuiteRecord } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

async function restore({ credentials, tableId, recordId }: { credentials: SmartSuiteCredentials; tableId: unknown; recordId: unknown }): Promise<SmartSuiteRecord> {
	return smartSuiteClient.request<SmartSuiteRecord>({
		credentials,
		method: HttpMethod.POST,
		path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/${smartSuiteClient.pathSegment({ value: recordId, label: 'Record ID' })}/restore/`,
		body: {},
		operation: 'restore record',
	});
}

export const restoreRecord = createAction({
	name: 'restore_record',
	classification: 'WRITE',
	displayName: 'Restore Record',
	description: 'Brings a deleted record back from the trash.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version that picks the record from the table trash; agents should use Restore Record (by ID). Restores one deleted SmartSuite record from the solution trash and returns it keyed by field slug. Idempotent: restoring a record that is not deleted leaves it as it is.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.deletedRecordDropdown,
	},
	outputSchema: outputSchemas['restoreRecord'],
	async run({ auth, propsValue }) {
		return restore({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, recordId: propsValue.recordId });
	},
});

export const restoreRecordById = createAction({
	name: 'restore_record_by_id',
	classification: 'WRITE',
	displayName: 'Restore Record (by ID)',
	description: 'Brings a deleted record back from the trash, by table ID and record ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Restores one deleted SmartSuite record from the solution trash and returns it keyed by field slug. Idempotent: restoring a record that is not deleted leaves it as it is. Get the Record ID and its Table ID (application_id) from List Deleted Records (by ID). Next: Get Record (by ID) or Update Record Fields.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		recordId: smartSuiteInputs.aiProps.recordId(),
	},
	outputSchema: outputSchemas['restoreRecord'],
	async run({ auth, propsValue }) {
		return restore({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, recordId: propsValue.recordId });
	},
});
