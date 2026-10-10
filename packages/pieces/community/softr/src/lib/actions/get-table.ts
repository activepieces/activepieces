import { createAction } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { softrOutputSchemas } from '../output-schemas';

export const getTable = createAction({
	auth: SoftrAuth,
	name: 'getTable',
	classification: 'READ',
	displayName: 'Get Table',
	description: 'Retrieves a table and its field definitions.',
	audience: 'both',
	aiMetadata: {
		description:
			'Gets one Softr table with all its columns: field IDs, names, types, select options, read-only and required. Use it before writing or searching records; agents can use Get Database Schema (Agent) to see every table in one call. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
	},
	outputSchema: softrOutputSchemas.table,
	async run({ auth, propsValue }) {
		return softrClient.getTable({
			apiKey: auth.secret_text,
			databaseId: propsValue.databaseId,
			tableId: propsValue.tableId,
		});
	},
});
