import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	googleSheetsCommon,
	labelToColumn,
	mapRowsToHeaderNames,
} from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { columnNameProp, commonProps } from '../common/props';

export const findRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'find_rows',
description: 'Look up rows in a worksheet based on a column value.',
	displayName: 'Find Rows',
	props: {
		...commonProps,
		columnName: columnNameProp(),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'The value to look for in the selected column. Leave empty to return all rows.',
			required: false,
		}),
		matchCase: Property.Checkbox({
			displayName: 'Exact Match',
			description: 'Only return rows where the cell value exactly matches the search value.',
			required: true,
			defaultValue: false,
		}),
		startingRow: Property.Number({
			displayName: 'Starting Row',
			description: 'Start searching from this row number.',
			required: false,
		}),
		numberOfRows: Property.Number({
			displayName: 'Number of Rows',
			description: 'How many rows to return. Defaults to 1 if not specified.',
			required: false,
			defaultValue: 1,
		}),
		headerRow: Property.Number({
			displayName: 'Header Row',
			description: 'The row number that contains the column names.',
			required: true,
			defaultValue: 1,
		}),
		useHeaderNames: Property.Checkbox({
			displayName: 'Use Column Names',
			description: 'Use column names as keys instead of A, B, C.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ propsValue, auth }) {
		await propsValidation.validateZod(propsValue, {
			startingRow: z.number().min(1).optional(),
			numberOfRows: z.number().min(1).optional(),
		});

		const spreadsheetId = propsValue.spreadsheetId;
		const sheetId = propsValue.sheetId;
		const startingRow = propsValue.startingRow ?? 1;
		const numberOfRowsToReturn = propsValue.numberOfRows ?? 1;
		const headerRow = propsValue.headerRow;
		const useHeaderNames = propsValue.useHeaderNames as boolean;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
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
		const columnName = propsValue.columnName ? propsValue.columnName : 'A';
		const columnNumber: number = labelToColumn(columnName);
		const searchValue = propsValue.searchValue ?? '';

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

			if (entry_value === undefined) {
				continue;
			}
			if (propsValue.matchCase) {
				if (entry_value === searchValue) {
					matchedRowCount += 1;
					matchingRows.push(rows[i]);
				}
			} else {
				if (entry_value.toLowerCase().includes(searchValue.toLowerCase())) {
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
