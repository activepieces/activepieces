import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { databaseIdDropdown, recordIdField, tableIdDropdown } from '../common/props';

export const deleteDatabaseRecord = createAction({
	auth: SoftrAuth,
	name: 'deleteDatabaseRecord',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Database Record',
	description: 'Deletes an existing database record.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes one record from a Softr table by its record ID (from Find Records or the trigger). This cannot be undone. A second call fails with not found.',
		idempotent: false,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		recordId: recordIdField,
	},
	async run({ auth, propsValue }) {
		const recordId = propsValue.recordId.trim();
		if (recordId.length === 0) {
			throw new Error('Record ID is required.');
		}
		await softrClient.request({
			apiKey: auth.secret_text,
			method: HttpMethod.DELETE,
			path: softrClient.recordPath({ databaseId: propsValue.databaseId, tableId: propsValue.tableId, recordId }),
		});
		return {
			success: true,
			message: 'Record deleted successfully',
			recordId,
		};
	},
});
