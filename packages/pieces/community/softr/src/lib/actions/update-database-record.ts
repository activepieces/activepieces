import { createAction } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { databaseIdDropdown, recordIdField, tableFields, tableIdDropdown } from '../common/props';
import { softrRecords } from '../common/records';
import { softrOutputSchemas } from '../output-schemas';

export const updateDatabaseRecord = createAction({
	auth: SoftrAuth,
	name: 'updateDatabaseRecord',
	classification: 'WRITE',
	displayName: 'Update Database Record',
	description: 'Updates an existing database record.',
	audience: 'both',
	aiMetadata: {
		description:
			'Changes some fields of one existing Softr record by its record ID, using the table field form. Agents: prefer Update Record (Agent), which takes column names as JSON. Only the given fields change; empty values are skipped, so it cannot clear a field. Safe to retry.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		recordId: recordIdField,
		fields: tableFields,
	},
	outputSchema: softrOutputSchemas.record,
	async run({ auth, propsValue }) {
		const recordId = propsValue.recordId.trim();
		if (recordId.length === 0) {
			throw new Error('Record ID is required.');
		}
		if (Object.keys(softrRecords.compactFieldValues(propsValue.fields)).length === 0) {
			throw new Error('Provide a value for at least one field to update.');
		}
		return softrRecords.writeRecord({
			apiKey: auth.secret_text,
			databaseId: propsValue.databaseId,
			tableId: propsValue.tableId,
			recordId,
			fields: propsValue.fields,
		});
	},
});
