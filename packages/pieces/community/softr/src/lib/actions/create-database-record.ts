import { createAction } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { databaseIdDropdown, tableFields, tableIdDropdown } from '../common/props';
import { softrRecords } from '../common/records';
import { softrOutputSchemas } from '../output-schemas';

export const createDatabaseRecord = createAction({
	auth: SoftrAuth,
	name: 'createDatabaseRecord',
	classification: 'WRITE',
	displayName: 'Create Database Record',
	description: 'Creates a new record.',
	audience: 'human',
	aiMetadata: {
		description:
			'Adds one new record to a Softr table using the table field form. Empty values are skipped. Each call adds a new record, so a retry makes a duplicate.',
		idempotent: false,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		fields: tableFields,
	},
	outputSchema: softrOutputSchemas.record,
	async run({ auth, propsValue }) {
		return softrRecords.writeRecord({
			apiKey: auth.secret_text,
			databaseId: propsValue.databaseId,
			tableId: propsValue.tableId,
			fields: propsValue.fields,
		});
	},
});
