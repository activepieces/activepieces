import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { softrClient } from './client';
import { SoftrAuth } from './auth';
import { SoftrDatabase, SoftrListResponse, SoftrTable, TableField } from './types';

function errorPlaceholder({ prefix, error }: { prefix: string; error: unknown }): string {
	return `${prefix}: ${error instanceof Error ? error.message : String(error)}`;
}

function buildFieldProp(field: TableField) {
	const displayName = field.name || field.id;
	const required = false;
	switch (field.type) {
		case 'SINGLE_LINE_TEXT':
		case 'EMAIL':
		case 'URL':
		case 'PHONE':
			return Property.ShortText({ displayName, required });
		case 'SELECT': {
			const options = (field.options?.choices ?? []).map((option) => ({
				label: option.label,
				value: option.id,
			}));
			return field.allowMultipleEntries
				? Property.StaticMultiSelectDropdown({ displayName, required, options: { options } })
				: Property.StaticDropdown({ displayName, required, options: { options } });
		}
		case 'LONG_TEXT':
			return Property.LongText({ displayName, required });
		case 'NUMBER':
		case 'CURRENCY':
		case 'PERCENT':
		case 'RATING':
			return Property.Number({ displayName, required });
		case 'CHECKBOX':
			return Property.Checkbox({ displayName, required });
		case 'DATETIME':
			return Property.DateTime({ displayName, required });
		case 'DURATION':
			return Property.Number({ displayName, description: 'Duration in seconds.', required });
		case 'ATTACHMENT':
			return Property.Array({ displayName, description: 'Public URLs of the files to attach.', required });
		case 'DATE':
			return Property.ShortText({
				displayName,
				description: 'Date in YYYY-MM-DD format.',
				required,
			});
		default:
			return null;
	}
}

export const databaseIdDropdown = Property.Dropdown({
	auth: SoftrAuth,
	displayName: 'Database ID',
	description: 'Select the database.',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first',
			};
		}
		try {
			const databases = await softrClient.request<SoftrListResponse<SoftrDatabase>>({
				apiKey: auth.secret_text,
				method: HttpMethod.GET,
				path: '/databases',
			});
			if (databases.data.length === 0) {
				return {
					disabled: true,
					options: [],
					placeholder: 'No databases found in the workspaces this API key can access.',
				};
			}
			return {
				disabled: false,
				options: databases.data.map((database) => ({
					label: database.name,
					value: database.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: errorPlaceholder({ prefix: 'Error loading databases', error }),
			};
		}
	},
});

export const tableIdDropdown = Property.Dropdown({
	displayName: 'Table ID',
	description: 'Select the table.',
	required: true,
	refreshers: ['auth', 'databaseId'],
	auth: SoftrAuth,
	options: async ({ auth, databaseId }) => {
		if (!auth || !databaseId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account and select a database first',
			};
		}
		try {
			const tables = await softrClient.request<SoftrListResponse<SoftrTable>>({
				apiKey: auth.secret_text,
				method: HttpMethod.GET,
				path: `/databases/${encodeURIComponent(String(databaseId))}/tables`,
			});
			return {
				disabled: false,
				options: tables.data.map((table) => ({
					label: table.name,
					value: table.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: errorPlaceholder({ prefix: 'Error loading tables', error }),
			};
		}
	},
});

export const recordIdField = Property.ShortText({
	displayName: 'Record ID',
	description: 'The ID of the record, e.g. from the Find Records action or the New Database Record trigger.',
	required: true,
});

export const tableFieldIdDropdown = Property.Dropdown({
	displayName: 'Field',
	refreshers: ['auth', 'databaseId', 'tableId'],
	auth: SoftrAuth,
	required: true,
	options: async ({ auth, databaseId, tableId }) => {
		if (!auth || !databaseId || !tableId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account and select a table first.',
			};
		}
		try {
			const table = await softrClient.getTable({
				apiKey: auth.secret_text,
				databaseId: String(databaseId),
				tableId: String(tableId),
			});
			return {
				disabled: false,
				options: table.fields.map((field) => ({
					label: field.name,
					value: field.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: errorPlaceholder({ prefix: 'Error loading fields', error }),
			};
		}
	},
});

export const tableFields = Property.DynamicProperties({
	displayName: 'Fields',
	required: true,
	refreshers: ['auth', 'databaseId', 'tableId'],
	auth: SoftrAuth,
	props: async ({ auth, databaseId, tableId }) => {
		if (!databaseId || !tableId || !auth) {
			return {};
		}
		try {
			const table = await softrClient.getTable({
				apiKey: auth.secret_text,
				databaseId: String(databaseId),
				tableId: String(tableId),
			});
			const dynamicProps: DynamicPropsValue = {};
			for (const field of table.fields ?? []) {
				const prop = field.readonly ? null : buildFieldProp(field);
				if (prop !== null) {
					dynamicProps[field.id] = prop;
				}
			}
			return dynamicProps;
		} catch {
			return {};
		}
	},
});

export const appDomainField = Property.ShortText({
	displayName: 'Softr Domain',
	description: 'The domain or subdomain of the published Softr app, e.g. myapp.softr.app or portal.example.com.',
	required: true,
});

export const appUserEmailField = Property.ShortText({
	displayName: 'User Email',
	description: 'The email address of the app user.',
	required: true,
});

export const agentDatabaseIdField = Property.ShortText({
	displayName: 'Database ID',
	description: 'The Softr database ID. Get it from List Databases.',
	required: true,
});

export const agentTableField = Property.ShortText({
	displayName: 'Table (name or ID)',
	description: 'The table name or table ID. Get both from Get Database Schema (Agent).',
	required: true,
});

export const agentFieldsJson = Property.Json({
	displayName: 'Fields',
	description:
		'A JSON object keyed by column name or field ID, e.g. {"Name": "Jane", "Age": 30, "Status": "Open"}. Select columns take the option label or ID; multi-select columns take a list.',
	required: true,
});
