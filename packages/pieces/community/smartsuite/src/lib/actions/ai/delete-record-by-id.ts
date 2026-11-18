import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../../auth';
import { smartSuiteClient } from '../../common/client';
import { smartSuiteInputs } from '../../common/inputs';
import { outputSchemas } from '../../output-schemas';

export const deleteRecordByIdAi = createAction({
	name: 'delete_record_by_id',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Record (by ID)',
	description: 'Moves one record to the trash by table ID and record ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Moves one SmartSuite record to the solution trash, given the Table ID and Record ID. It can be brought back with Restore Record (by ID). Use Delete Records (Bulk, by ID) for several. Idempotent: deleting a record already in the trash succeeds again, and a record that no longer exists (404) returns alreadyDeleted true.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		recordId: smartSuiteInputs.aiProps.recordId(),
	},
	outputSchema: outputSchemas['deleteRecord'],
	async run({ auth, propsValue }) {
		const recordId = smartSuiteInputs.requireText({ value: propsValue.recordId, label: 'Record ID' });
		try {
			await smartSuiteClient.request<unknown>({
				credentials: smartSuiteClient.credentialsOf(auth),
				method: HttpMethod.DELETE,
				path: `/applications/${smartSuiteClient.pathSegment({ value: propsValue.tableId, label: 'Table ID' })}/records/${smartSuiteClient.pathSegment({ value: recordId, label: 'Record ID' })}/`,
				operation: 'delete record',
			});
			return { id: recordId, deleted: true, alreadyDeleted: false };
		} catch (error) {
			if (smartSuiteClient.statusOf(error) === 404) {
				return { id: recordId, deleted: true, alreadyDeleted: true };
			}
			throw error;
		}
	},
});
