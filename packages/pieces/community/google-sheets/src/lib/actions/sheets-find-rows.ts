import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	googleSheetsAuth,
	googleSheetsCommon,
	labelToColumn,
	mapRowsToHeaderNames,
} from '../common/common';
import * as z from 'zod/mini';
import { propsValidation } from '@activepieces/pieces-common';

export const sheetsFindRows = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_find_rows',
	displayName: 'Find Rows',
	description: 'Look up rows in a worksheet based on a column value.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches a worksheet for rows whose value in a chosen column matches a search value (exact or contains), returning up to a requested number of matches with their row numbers. Use to locate rows before reading, updating, or deleting them; leave the search value empty to fetch rows sequentially. This is the resolver that yields the row numbers other atomics need. Read-only.',
		idempotent: true,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Spreadsheet ID',
			description:
				'The ID of the spreadsheet (the Drive file id). Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		sheet_id: Property.Number({
			displayName: 'Worksheet ID',
			description:
				'The numeric worksheet (tab) id. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		column_name: Property.ShortText({
			displayName: 'Column',
			description:
				'The column letter to search in (e.g. "A", "B", "C"). Defaults to "A" if omitted.',
			required: false,
		}),
		search_value: Property.ShortText({
			displayName: 'Search Value',
			description: 'The value to look for in the selected column. Leave empty to return all rows.',
			required: false,
		}),
		match_case: Property.Checkbox({
			displayName: 'Exact Match',
			description: 'Only return rows where the cell value exactly matches the search value.',
			required: true,
			defaultValue: false,
		}),
		starting_row: Property.Number({
			displayName: 'Starting Row',
			description: 'Start searching from this row number.',
			required: false,
		}),
		number_of_rows: Property.Number({
			displayName: 'Number of Rows',
			description: 'How many matching rows to return. Defaults to 1 if not specified.',
			required: false,
			defaultValue: 1,
		}),
		header_row: Property.Number({
			displayName: 'Header Row',
			description: 'The row number that contains the column names.',
			required: true,
			defaultValue: 1,
		}),
		use_header_names: Property.Checkbox({
			displayName: 'Use Column Names',
			description: 'Use column names as keys instead of A, B, C.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ propsValue, auth }) {
		await propsValidation.validateZod(propsValue, {
			starting_row: z.optional(z.number().check(z.minimum(1))),
			number_of_rows: z.optional(z.number().check(z.minimum(1))),
		});

		const spreadsheetId = propsValue.spreadsheet_id;
		const sheetId = propsValue.sheet_id;
		const startingRow = propsValue.starting_row ?? 1;
		const numberOfRowsToReturn = propsValue.number_of_rows ?? 1;
		const headerRow = propsValue.header_row;
		const useHeaderNames = propsValue.use_header_names as boolean;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const rows = await googleSheetsCommon.getGoogleSheetRows({
			spreadsheetId: spreadsheetId as string,
			auth: auth,
			sheetId: sheetId as number,
			rowIndex_s: startingRow,
			rowIndex_e: undefined,
			headerRow: headerRow,
		});

		const values = rows.map((row) => {
			return row.values;
		});

		const matchingRows: any[] = [];
		const columnName = propsValue.column_name ? propsValue.column_name : 'A';
		const columnNumber: number = labelToColumn(columnName);
		const searchValue = propsValue.search_value ?? '';

		let matchedRowCount = 0;

		for (let i = 0; i < values.length; i++) {
			const row: Record<string, any> = values[i];

			if (matchedRowCount === numberOfRowsToReturn) break;

			if (searchValue === '') {
				matchingRows.push(rows[i]);
				matchedRowCount += 1;
				continue;
			}

			const keys = Object.keys(row);
			if (keys.length <= columnNumber) continue;
			const entry_value = row[keys[columnNumber]];

			if (entry_value === undefined || entry_value === null) {
				continue;
			}
			const entryAsString = String(entry_value);
			if (propsValue.match_case) {
				if (entryAsString === searchValue) {
					matchedRowCount += 1;
					matchingRows.push(rows[i]);
				}
			} else {
				if (entryAsString.toLowerCase().includes(searchValue.toLowerCase())) {
					matchedRowCount += 1;
					matchingRows.push(rows[i]);
				}
			}
		}

		const finalRows = await mapRowsToHeaderNames(
			matchingRows,
			useHeaderNames,
			spreadsheetId as string,
			sheetId as number,
			headerRow,
			auth,
		);

		return finalRows;
	},
});
