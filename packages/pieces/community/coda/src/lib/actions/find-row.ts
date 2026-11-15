import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaRow, codaClient } from '../common/types';
import { columnIdsDropdown, docIdDropdown, tableIdDropdown } from '../common/props';
import { codaApi } from '../common/client';
import { findRowActionOutputSchema } from '../output-schemas';

const PAGE_SIZE = 500;

export const findRowAction = createAction({
	auth: codaAuth,
	name: 'find-row',
	classification: 'SEARCH',
	displayName: 'Find Row(s)',
	description: 'Find specific rows in the selected table using a column match search.',
	audience: 'human',
	aiMetadata: { description: 'Search a Coda table for rows where a chosen column equals a given value, paging through all matches. Use to look up rows by a field value before reading or updating them; pair with Update Row using a returned row ID. Read-only and idempotent.', idempotent: true },
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
		searchColumn: columnIdsDropdown('Search Column', true),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'Rows whose column equals this value are returned.',
			required: true,
		}),
		maxRows: Property.Number({
			displayName: 'Max Rows',
			description: 'Stop after this many matching rows. Leave empty to return every match.',
			required: false,
		}),
	},
	outputSchema: findRowActionOutputSchema,
	async run(context) {
		const { docId, tableId, searchColumn, searchValue, maxRows } = context.propsValue;
		if (maxRows !== undefined && maxRows !== null && (!Number.isInteger(maxRows) || maxRows < 1)) {
			throw new Error('Max Rows must be a whole number of 1 or more, or empty for all rows.');
		}
		const client = codaClient(context.auth);
		const query = codaApi.buildRowQuery({ column: String(searchColumn), value: searchValue });

		const matchedRows: CodaRow[] = [];
		let nextPageToken: string | undefined = undefined;

		do {
			const response = await client.listRows(docId, tableId, {
				query,
				sortBy: 'natural',
				useColumnNames: true,
				valueFormat: 'simpleWithArrays',
				visibleOnly: true,
				limit: PAGE_SIZE,
				pageToken: nextPageToken,
			});

			if (response.items) {
				matchedRows.push(...response.items);
			}
			nextPageToken = response.nextPageToken;
		} while (nextPageToken && (maxRows === undefined || maxRows === null || matchedRows.length < maxRows));

		const result = maxRows ? matchedRows.slice(0, maxRows) : matchedRows;

		return {
			found: result.length > 0,
			result,
		};
	},
});
