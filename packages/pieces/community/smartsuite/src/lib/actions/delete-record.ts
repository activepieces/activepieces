import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common/props';
import { smartSuiteClient } from '../common/client';
import { outputSchemas } from '../output-schemas';

export const deleteRecord = createAction({
	name: 'delete_record',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete a Record',
	description: 'Deletes a record from the specified table',
	audience: 'human',
	aiMetadata: {
		description: 'Moves one SmartSuite record to the solution trash (it can be brought back with Restore Record). Agents should use Delete Record (by ID). Idempotent: deleting a record that is already in the trash succeeds again, and a record that no longer exists at all (404) succeeds with alreadyDeleted true.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
	},
	outputSchema: outputSchemas['deleteRecord'],
	async run({ auth, propsValue }) {
		const { tableId, recordId } = propsValue;
		const recordPath = `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/${smartSuiteClient.pathSegment({ value: recordId, label: 'Record ID' })}/`;
		try {
			const response = await smartSuiteClient.request<unknown>({
				credentials: smartSuiteClient.credentialsOf(auth),
				method: HttpMethod.DELETE,
				path: recordPath,
				operation: 'delete record',
			});
			const vendorFields = response !== null && typeof response === 'object' && !Array.isArray(response) ? response : {};
			return { ...vendorFields, id: String(recordId).trim(), deleted: true, alreadyDeleted: false };
		} catch (error) {
			if (smartSuiteClient.statusOf(error) === 404) {
				return { id: String(recordId).trim(), deleted: true, alreadyDeleted: true };
			}
			throw error;
		}
	},
});
