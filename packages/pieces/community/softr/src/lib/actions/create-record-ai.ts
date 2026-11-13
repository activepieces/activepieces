import { createAction } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrAgent } from '../common/agent';
import { agentDatabaseIdField, agentFieldsJson, agentTableField } from '../common/props';
import { softrRecords } from '../common/records';
import { softrOutputSchemas } from '../output-schemas';

export const createRecordAi = createAction({
	auth: SoftrAuth,
	name: 'create_record_ai',
	classification: 'WRITE',
	displayName: 'Create Record (Agent)',
	description: 'Adds a record to a Softr table using column names.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds one new record to a Softr table. Agents: use this instead of Create Database Record. Needs the database ID, the table name or ID, and a JSON object of values keyed by column name or field ID (see Get Database Schema (Agent)). Returns the new record with values keyed by column name. Each call adds a new record, so a retry makes a duplicate; use Upsert Record (Agent) to avoid that.',
		idempotent: false,
	},
	props: {
		databaseId: agentDatabaseIdField,
		table: agentTableField,
		fields: agentFieldsJson,
	},
	outputSchema: softrOutputSchemas.record,
	async run({ auth, propsValue }) {
		const apiKey = auth.secret_text;
		const databaseId = softrAgent.requireText({ value: propsValue.databaseId, label: 'Database ID' });
		const reference = softrAgent.requireText({ value: propsValue.table, label: 'Table' });
		const input = softrAgent.parseFieldsInput(propsValue.fields);
		const table = await softrAgent.resolveTable({ apiKey, databaseId, reference });
		const fields = softrAgent.buildFieldValues({ table, fields: input });
		return softrRecords.writeRecord({ apiKey, databaseId, tableId: table.id, fields, tableFields: table.fields });
	},
});
