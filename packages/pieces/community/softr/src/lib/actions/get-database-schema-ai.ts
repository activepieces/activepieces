import { createAction } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrAgent } from '../common/agent';
import { agentDatabaseIdField } from '../common/props';
import { softrOutputSchemas } from '../output-schemas';

export const getDatabaseSchemaAi = createAction({
	auth: SoftrAuth,
	name: 'get_database_schema_ai',
	classification: 'READ',
	displayName: 'Get Database Schema (Agent)',
	description: 'Gets every table and column in a Softr database.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns every table in a Softr database with all its columns: field ID, column name, type, required, read-only and select options (ID and label). Call this first, before you create, update or search records. Needs the database ID from List Databases. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: agentDatabaseIdField,
	},
	outputSchema: softrOutputSchemas.databaseSchema,
	async run({ auth, propsValue }) {
		const databaseId = softrAgent.requireText({ value: propsValue.databaseId, label: 'Database ID' });
		const tables = await softrAgent.listTables({ apiKey: auth.secret_text, databaseId });
		return {
			databaseId,
			tableCount: tables.length,
			tables: tables.map((table) => ({
				id: table.id,
				name: table.name,
				description: table.description ?? null,
				primaryFieldId: table.primaryFieldId ?? null,
				fields: (table.fields ?? []).map((field) => ({
					id: field.id,
					name: field.name,
					type: field.type,
					required: field.required ?? false,
					readonly: field.readonly,
					allowMultipleEntries: field.allowMultipleEntries,
					options: (field.options?.choices ?? []).map((choice) => ({ id: choice.id, label: choice.label })),
				})),
			})),
		};
	},
});
