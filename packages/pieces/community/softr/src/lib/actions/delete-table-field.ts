import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown, tableFieldIdDropdown, tableIdDropdown } from '../common/props';

export const deleteTableField = createAction({
	auth: SoftrAuth,
	name: 'deleteTableField',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Table Field',
	description: 'Permanently deletes a field (column) and all of its values.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a column from a Softr table, including its value in every record. Only use when the user clearly asked for it: this cannot be undone. A second call fails with not found.',
		idempotent: false,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		fieldId: tableFieldIdDropdown,
	},
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const tableId = softrAdmin.requireId({ value: propsValue.tableId, label: 'Table ID' });
		const fieldId = softrAdmin.requireId({ value: propsValue.fieldId, label: 'Field ID' });
		await softrClient.request({
			apiKey: auth.secret_text,
			method: HttpMethod.DELETE,
			path: softrClient.fieldPath({ databaseId, tableId, fieldId }),
		});
		return { success: true, fieldId };
	},
});
