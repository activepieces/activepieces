import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaRow, codaClient } from '../common/types';
import { columnIdsDropdown, docIdDropdown, tableIdDropdown } from '../common/props';

export const findRowAction = createAction({
	auth: codaAuth,
	name: 'find-row',
	displayName: 'Find Row(s)',
	description: 'Find specific rows in the selected table using a column match search.',
	audience: 'both',
	aiMetadata: { description: 'Search a Coda table for rows where a chosen column equals a given value, paging through all matches. Use to look up rows by a field value before reading or updating them; pair with Update Row using a returned row ID. Read-only and idempotent.', idempotent: true },
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
		searchColumn: columnIdsDropdown('Search Column', true),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			required: true,
		}),
	},
	async run(context) {
		const { docId, tableId, searchColumn, searchValue } = context.propsValue;
		const client = codaClient(context.auth);

		const matchedRows: CodaRow[] = [];
		let nextPageToken: string | undefined = undefined;

		do {
			const response = await client.listRows(docId, tableId, {
				query: `${searchColumn}:${JSON.stringify(searchValue)}`,
				sortBy: 'natural',
				useColumnNames: true,
				valueFormat: 'simpleWithArrays',
				visibleOnly: true,
				limit: 100,
				pageToken: nextPageToken,
			});

			if (response.items) {
				matchedRows.push(...response.items);
			}
			nextPageToken = response.nextPageToken;
		} while (nextPageToken);

		return {
			found: matchedRows.length > 0,
			result: matchedRows,
		};
	},
});
