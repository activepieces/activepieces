import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown, tableFieldIdDropdown, tableIdDropdown } from '../common/props';
import { SoftrSingleResponse, TableField } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const updateTableField = createAction({
	auth: SoftrAuth,
	name: 'updateTableField',
	classification: 'WRITE',
	displayName: 'Update Table Field',
	description: 'Renames a field, changes its type, or changes its options.',
	audience: 'both',
	aiMetadata: {
		description:
			'Changes a column of a Softr table: name, type and/or JSON options. Empty inputs keep the current value. New options replace all existing options, e.g. the full list of select choices. Changing the type can convert or drop data, so only do it when the user asked. Safe to retry.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		fieldId: tableFieldIdDropdown,
		name: Property.ShortText({
			displayName: 'New Name',
			description: 'Leave empty to keep the current name.',
			required: false,
		}),
		type: softrAdmin.fieldTypeDropdown({ required: false }),
		options: Property.Json({
			displayName: 'New Options',
			description: 'Leave empty to keep. When set, replaces all options and choices.',
			required: false,
		}),
	},
	outputSchema: softrOutputSchemas.field,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const tableId = softrAdmin.requireId({ value: propsValue.tableId, label: 'Table ID' });
		const fieldId = softrAdmin.requireId({ value: propsValue.fieldId, label: 'Field ID' });
		const name = softrAdmin.optionalText(propsValue.name);
		const type = propsValue.type === undefined || propsValue.type === null || propsValue.type === '' ? undefined : softrAdmin.readFieldType(propsValue.type);
		const options = softrAdmin.parseOptions({ value: propsValue.options, label: 'New Options' });
		if (name === undefined && type === undefined && options === undefined) {
			throw new Error('Provide a new name, type or options.');
		}
		const apiKey = auth.secret_text;
		const path = softrClient.fieldPath({ databaseId, tableId, fieldId });
		const current = await softrClient.request<SoftrSingleResponse<TableField>>({ apiKey, method: HttpMethod.GET, path });
		const nextType = type ?? current.data.type;
		const keepOptions = nextType === current.data.type ? current.data.options : undefined;
		const nextOptions = options ?? keepOptions;
		const response = await softrClient.request<SoftrSingleResponse<TableField>>({
			apiKey,
			method: HttpMethod.PUT,
			path,
			body: {
				name: name ?? current.data.name,
				type: nextType,
				...(nextOptions !== undefined && nextOptions !== null ? { options: nextOptions } : {}),
			},
		});
		return response.data;
	},
});
