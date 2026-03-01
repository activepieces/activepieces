import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest, transformRecordFields } from '../common/client';
import { databaseIdDropdown, tableFields, tableIdDropdown } from '../common/props';
import { isNil } from '@activepieces/shared';
import { TableField } from '../common/types';

export const createDatabaseRecord = createAction({
	auth: SoftrAuth,
	name: 'createDatabaseRecord',
	displayName: 'Create Database Record',
	description: 'Creates a new record.',
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		fields: tableFields,
	},
	async run({ auth, propsValue }) {
		const { databaseId, tableId } = propsValue;

		const fields = propsValue.fields ?? {};

		const formattedFields: Record<string, any> = {};

		for (const [key, value] of Object.entries(fields)) {
			if (isNil(value) || value === '') continue;
			if (Array.isArray(value) && value.length === 0) continue;
			formattedFields[key] = value;
		}

		const response = await makeRequest<{
			data: { id: string; createdAt: string; updatedAt: string; fields: Record<string, any> };
		}>(auth, HttpMethod.POST, `/databases/${databaseId}/tables/${tableId}/records`, {
			fields: formattedFields,
		});

		const tableReponse = await makeRequest<{
			data: {
				fields: TableField[];
			};
		}>(auth, HttpMethod.GET, `/databases/${databaseId}/tables/${tableId}`);

		const transformedFields = transformRecordFields(tableReponse.data.fields, response.data.fields);

		return {
			...response.data,
			fields: transformedFields,
		};
	},
});
