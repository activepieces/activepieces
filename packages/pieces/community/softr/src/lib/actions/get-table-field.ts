import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown, tableFieldIdDropdown, tableIdDropdown } from '../common/props';
import { SoftrSingleResponse, TableField } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const getTableField = createAction({
	auth: SoftrAuth,
	name: 'getTableField',
	classification: 'READ',
	displayName: 'Get Table Field',
	description: 'Retrieves one field definition of a Softr table.',
	audience: 'both',
	aiMetadata: {
		description:
			'Gets one column of a Softr table by field ID: name, type, options (such as select choices), read-only and required. To see all columns at once, use Get Table. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		fieldId: tableFieldIdDropdown,
	},
	outputSchema: softrOutputSchemas.field,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const tableId = softrAdmin.requireId({ value: propsValue.tableId, label: 'Table ID' });
		const fieldId = softrAdmin.requireId({ value: propsValue.fieldId, label: 'Field ID' });
		const response = await softrClient.request<SoftrSingleResponse<TableField>>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: softrClient.fieldPath({ databaseId, tableId, fieldId }),
		});
		return response.data;
	},
});
