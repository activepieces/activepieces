import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../..';
import { CodaRow, codaClient } from '../common/types';
import { columnIdsDropdown, docIdDropdown, tableIdDropdown } from '../common/props';

export const findRowAction = createAction({
	auth: codaAuth,
	name: 'find-row',
	displayName: 'Find Row(s)',
	description: 'Find specific rows in the selected table using a column match search.',
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
