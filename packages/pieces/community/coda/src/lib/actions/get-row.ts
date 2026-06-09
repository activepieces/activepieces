import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaClient } from '../common/types';
import { docIdDropdown, tableIdDropdown } from '../common/props';

export const getRowAction = createAction({
	auth: codaAuth,
	name: 'get-row',
	displayName: 'Get Row',
	description: 'Retrieves a single row by specified ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetch one row from a Coda table by its row ID or unique row name, returning its cell values. Use when you already have a specific row identifier; use Find Row(s) instead to search by a column value. Read-only and idempotent.', idempotent: true },
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
		rowIdOrName: Property.ShortText({
			displayName: 'Row ID or Name',
			required: true,
		}),
	},
	async run(context) {
		const { docId, tableId, rowIdOrName } = context.propsValue;
		const client = codaClient(context.auth);

		return await client.getRow(docId, tableId, rowIdOrName, {
			useColumnNames: true,
			valueFormat: 'simpleWithArrays',
		});
	},
});
