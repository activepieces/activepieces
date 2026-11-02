import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { SoftrSingleResponse, SoftrTable } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const updateTable = createAction({
	auth: SoftrAuth,
	name: 'updateTable',
	classification: 'WRITE',
	displayName: 'Update Table',
	description: 'Renames a Softr table or changes its description.',
	audience: 'both',
	aiMetadata: {
		description:
			'Renames a Softr table and/or changes its description (use Update Table Field for columns). Only the values you give change; tick Clear Description to blank it. Safe to retry.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		name: Property.ShortText({
			displayName: 'New Name',
			description: 'Leave empty to keep the current name.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'New Description',
			description: 'Leave empty to keep the current description.',
			required: false,
		}),
		clearDescription: Property.Checkbox({
			displayName: 'Clear Description',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: softrOutputSchemas.table,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const tableId = softrAdmin.requireId({ value: propsValue.tableId, label: 'Table ID' });
		const body = softrAdmin.buildNameDescriptionUpdate({
			name: propsValue.name,
			description: propsValue.description,
			clearDescription: propsValue.clearDescription,
		});
		const apiKey = auth.secret_text;
		const name = body['name'] ?? (await softrClient.getTable({ apiKey, databaseId, tableId })).name;
		const response = await softrClient.request<SoftrSingleResponse<SoftrTable>>({
			apiKey,
			method: HttpMethod.PUT,
			path: softrClient.tablePath({ databaseId, tableId }),
			body: { ...body, name },
		});
		return response.data;
	},
});
