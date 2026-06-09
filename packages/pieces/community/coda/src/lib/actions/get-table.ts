import { codaAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { docIdDropdown, tableIdDropdown } from '../common/props';
import { codaClient } from '../common/types';

export const getTableAction = createAction({
	auth: codaAuth,
	name: 'get-table',
	displayName: 'Get Table',
	description: 'Get structure and details of a specific table (e.g., columns, schema).',
	audience: 'both',
	aiMetadata: { description: 'Retrieve the metadata of a single Coda table, including its columns and schema. Use to inspect a table structure before building row payloads or mapping fields. Requires the doc and table; read-only and idempotent.', idempotent: true },
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
	},
	async run(context) {
		const { docId, tableId } = context.propsValue;
		const client = codaClient(context.auth);

		return await client.getTableDetails(docId, tableId, {});
	},
});
