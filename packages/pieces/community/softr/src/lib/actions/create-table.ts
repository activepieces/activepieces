import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown } from '../common/props';
import { SoftrSingleResponse, SoftrTable } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

function readFields(rawFields: unknown[]): { name: string; type: string; options?: Record<string, unknown> }[] {
	return rawFields.map((raw, index) => {
		if (typeof raw !== 'object' || raw === null) {
			throw new Error(`Field ${index + 1} is not valid.`);
		}
		const name = softrAdmin.requireId({ value: 'name' in raw ? raw.name : undefined, label: `Field ${index + 1} name` });
		const type = softrAdmin.readFieldType('type' in raw ? raw.type : undefined);
		const options = softrAdmin.parseOptions({ value: 'options' in raw ? raw.options : undefined, label: `Field ${index + 1} options` });
		return { name, type, ...(options !== undefined ? { options } : {}) };
	});
}

export const createTable = createAction({
	auth: SoftrAuth,
	name: 'createTable',
	classification: 'WRITE',
	displayName: 'Create Table',
	description: 'Creates a new table in a Softr database.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a table in a Softr database with the columns you list (name, type, optional JSON options). Primary Field Name picks the primary column; otherwise the first one is used. Returns the table with its field IDs. Each call creates another table.',
		idempotent: false,
	},
	props: {
		databaseId: databaseIdDropdown,
		name: Property.ShortText({
			displayName: 'Table Name',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		primaryFieldName: Property.ShortText({
			displayName: 'Primary Field Name',
			description: 'Additional field to use as the primary field. Defaults to the first.',
			required: false,
		}),
		fields: Property.Array({
			displayName: 'Additional Fields',
			required: false,
			properties: {
				name: Property.ShortText({ displayName: 'Field Name', required: true }),
				type: softrAdmin.fieldTypeDropdown({ required: true }),
				options: Property.LongText({
					displayName: 'Options (JSON)',
					description: 'Type-specific JSON options. LINKED_RECORD, LOOKUP, ROLLUP need them.',
					placeholder: '{"choices":[{"label":"Open"},{"label":"Closed"}]}',
					required: false,
				}),
			},
		}),
	},
	outputSchema: softrOutputSchemas.table,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const name = softrAdmin.requireId({ value: propsValue.name, label: 'Table name' });
		const description = softrAdmin.optionalText(propsValue.description);
		const primaryFieldName = softrAdmin.optionalText(propsValue.primaryFieldName);
		const fields = readFields(propsValue.fields ?? []);
		const response = await softrClient.request<SoftrSingleResponse<SoftrTable>>({
			apiKey: auth.secret_text,
			method: HttpMethod.POST,
			path: `${softrClient.databasePath({ databaseId })}/tables`,
			body: {
				name,
				...(description !== undefined ? { description } : {}),
				...(primaryFieldName !== undefined ? { primaryFieldName } : {}),
				...(fields.length > 0 ? { fields } : {}),
			},
		});
		return response.data;
	},
});
