import { createAction, Property } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrAgent } from '../common/agent';
import { agentDatabaseIdField, agentFieldsJson, agentTableField } from '../common/props';
import { softrOutputSchemas } from '../output-schemas';

export const upsertRecordAi = createAction({
	auth: SoftrAuth,
	name: 'upsert_record_ai',
	classification: 'WRITE',
	displayName: 'Upsert Record (Agent)',
	description: 'Updates the record whose key column matches, or creates it.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds the record whose key column equals the key value in Fields (matching ignores letter case). If none exists it creates one; if one exists it updates it; if several match it stops with an error and changes nothing. Use this to avoid duplicates, e.g. key on Email. Needs the database ID, the table name or ID, the key column, and Fields including the key value. Returns {action: "created" or "updated", record}. Safe to retry.',
		idempotent: true,
	},
	props: {
		databaseId: agentDatabaseIdField,
		table: agentTableField,
		keyField: Property.ShortText({
			displayName: 'Key Column (name or ID)',
			description: 'The column that identifies the record, e.g. Email.',
			required: true,
		}),
		fields: agentFieldsJson,
	},
	outputSchema: softrOutputSchemas.upsertRecord,
	async run({ auth, propsValue }) {
		const apiKey = auth.secret_text;
		const databaseId = softrAgent.requireText({ value: propsValue.databaseId, label: 'Database ID' });
		const reference = softrAgent.requireText({ value: propsValue.table, label: 'Table' });
		const keyField = softrAgent.requireText({ value: propsValue.keyField, label: 'Key Column' });
		const fields = softrAgent.parseFieldsInput(propsValue.fields);
		const table = await softrAgent.resolveTable({ apiKey, databaseId, reference });
		return softrAgent.upsertRecord({ apiKey, databaseId, table, keyField, fields });
	},
});
