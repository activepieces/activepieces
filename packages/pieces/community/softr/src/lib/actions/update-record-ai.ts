import { createAction, Property } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrAgent } from '../common/agent';
import { agentDatabaseIdField, agentFieldsJson, agentTableField } from '../common/props';
import { softrRecords } from '../common/records';
import { softrOutputSchemas } from '../output-schemas';

export const updateRecordAi = createAction({
	auth: SoftrAuth,
	name: 'update_record_ai',
	classification: 'WRITE',
	displayName: 'Update Record (Agent)',
	description: 'Changes some columns of a Softr record using column names.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Changes the given columns of one existing Softr record; other columns stay as they are. Agents: use this instead of Update Database Record. Needs the database ID, the table name or ID, the record ID (from Find Records) and a JSON object of new values keyed by column name or field ID. Empty values are skipped, so it cannot clear a column. Returns the updated record. Safe to retry.',
		idempotent: true,
	},
	props: {
		databaseId: agentDatabaseIdField,
		table: agentTableField,
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The ID of the record to change. Get it from Find Records.',
			required: true,
		}),
		fields: agentFieldsJson,
	},
	outputSchema: softrOutputSchemas.record,
	async run({ auth, propsValue }) {
		const apiKey = auth.secret_text;
		const databaseId = softrAgent.requireText({ value: propsValue.databaseId, label: 'Database ID' });
		const reference = softrAgent.requireText({ value: propsValue.table, label: 'Table' });
		const recordId = softrAgent.requireText({ value: propsValue.recordId, label: 'Record ID' });
		const input = softrAgent.parseFieldsInput(propsValue.fields);
		const table = await softrAgent.resolveTable({ apiKey, databaseId, reference });
		const fields = softrAgent.buildFieldValues({ table, fields: input });
		return softrRecords.writeRecord({ apiKey, databaseId, tableId: table.id, recordId, fields, tableFields: table.fields });
	},
});
