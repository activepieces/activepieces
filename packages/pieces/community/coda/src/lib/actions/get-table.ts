import { codaAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { docIdDropdown, tableIdDropdown } from '../common/props';
import { codaClient } from '../common/types';
import { getTableActionOutputSchema } from '../output-schemas';

export const getTableAction = createAction({
	auth: codaAuth,
	name: 'get-table',
	classification: 'READ',
	displayName: 'Get Table',
	description: 'Get the details of a specific table: name, type, row count, display column and layout.',
	audience: 'human',
	aiMetadata: { description: 'Retrieve the metadata of a single Coda table: name, type, row count, display column and layout. It does not return the columns; use List Columns for those. Read-only and idempotent.', idempotent: true },
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
	},
	outputSchema: getTableActionOutputSchema,
	async run(context) {
		const { docId, tableId } = context.propsValue;
		const client = codaClient(context.auth);

		return await client.getTableDetails(docId, tableId, {});
	},
});
