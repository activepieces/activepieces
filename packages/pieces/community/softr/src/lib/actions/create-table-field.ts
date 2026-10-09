import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { SoftrSingleResponse, TableField } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const createTableField = createAction({
	auth: SoftrAuth,
	name: 'createTableField',
	classification: 'WRITE',
	displayName: 'Create Table Field',
	description: 'Adds a new field (column) to a Softr table.',
	audience: 'both',
	aiMetadata: {
		description:
			'Adds a column to a Softr table. Needs a name and a Softr field type; options are optional JSON, e.g. select choices or {"precision":"DATE"} for a date-only DATETIME. Returns the new field with its ID. Each call adds another column.',
		idempotent: false,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		name: Property.ShortText({
			displayName: 'Field Name',
			required: true,
		}),
		type: softrAdmin.fieldTypeDropdown({ required: true }),
		options: Property.Json({
			displayName: 'Options',
			description: 'Type-specific JSON options. LINKED_RECORD, LOOKUP, ROLLUP need them.',
			placeholder: '{"choices":[{"label":"Open"},{"label":"Closed"}]}',
			required: false,
		}),
	},
	outputSchema: softrOutputSchemas.field,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const tableId = softrAdmin.requireId({ value: propsValue.tableId, label: 'Table ID' });
		const name = softrAdmin.requireId({ value: propsValue.name, label: 'Field name' });
		const type = softrAdmin.readFieldType(propsValue.type);
		const options = softrAdmin.parseOptions({ value: propsValue.options, label: 'Options' });
		const response = await softrClient.request<SoftrSingleResponse<TableField>>({
			apiKey: auth.secret_text,
			method: HttpMethod.POST,
			path: `${softrClient.tablePath({ databaseId, tableId })}/fields`,
			body: { name, type, ...(options !== undefined ? { options } : {}) },
		});
		return response.data;
	},
});
