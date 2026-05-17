import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { google } from 'googleapis';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
	googleSheetsCommon,
	labelToColumn,
	mapRowsToHeaderNames,
	objectToArray,
	stringifyArray,
	ValueInputOption,
} from '../common/common';
import { columnNameProp, commonProps, isFirstRowHeaderProp, rowValuesProp } from '../common/props';
import { getWorkSheetName } from '../triggers/helpers';

export const findOrCreateRowAction = createAction({
	auth: googleSheetsAuth,
	name: 'find-or-create-row',
	displayName: 'Find or Create Row',
	description: 'Look up a row by column value; if no match is found, create a new row with the provided values.',
	props: {
		...commonProps,
		columnName: columnNameProp(),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'The value to look for in the selected column.',
			required: true,
		}),
		matchCase: Property.Checkbox({
			displayName: 'Exact Match',
			description: 'Only treat exact matches as found.',
			required: true,
			defaultValue: false,
		}),
		headerRow: Property.Number({
			displayName: 'Header Row',
			description: 'The row that contains the column names.',
			required: true,
			defaultValue: 1,
		}),
		useHeaderNames: Property.Checkbox({
			displayName: 'Use Column Names',
			description: 'Return found rows with header names as keys instead of A, B, C.',
			required: false,
			defaultValue: false,
		}),
		first_row_headers: isFirstRowHeaderProp(),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description: 'Inserted values that are dates and formulas will be entered as strings and have no effect.',
			required: false,
		}),
		values: rowValuesProp(),
	},
	async run({ auth, propsValue }) {
		const {
			spreadsheetId: inputSpreadsheetId,
			sheetId: inputSheetId,
			columnName,
			searchValue,
			matchCase,
			headerRow,
			useHeaderNames,
			first_row_headers,
			as_string,
			values,
		} = propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const spreadsheetId = inputSpreadsheetId as string;
		const sheetId = Number(inputSheetId);

		const existingRows = await googleSheetsCommon.getGoogleSheetRows({
			spreadsheetId,
			auth,
			sheetId,
			rowIndex_s: 1,
			rowIndex_e: undefined,
			headerRow,
		});

		const columnLetter = columnName ?? 'A';
		const columnIndex = labelToColumn(columnLetter);

		const match = existingRows.find((row) => {
			const keys = Object.keys(row.values);
			if (keys.length <= columnIndex) return false;
			const cell = row.values[keys[columnIndex]];
			if (isNil(cell)) return false;
			const cellAsString = String(cell);
			return matchCase
				? cellAsString === searchValue
				: cellAsString.toLowerCase().includes(String(searchValue).toLowerCase());
		});

		if (match) {
			const [mapped] = await mapRowsToHeaderNames(
				[match],
				useHeaderNames as boolean,
				spreadsheetId,
				sheetId,
				headerRow,
				auth,
			);
			return {
				found: true,
				created: false,
				...mapped,
			};
		}

		const sheetName = await getWorkSheetName(auth, spreadsheetId, sheetId);
		const authClient = await createGoogleClient(auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const formattedValues = first_row_headers
			? objectToArray(values).map((val) => (isNil(val) ? '' : val))
			: (values.values as unknown[]);

		const appendResponse = await sheets.spreadsheets.values.append({
			spreadsheetId,
			range: `${sheetName}!A:A`,
			valueInputOption: as_string ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED,
			requestBody: {
				majorDimension: Dimension.ROWS,
				values: [stringifyArray(formattedValues)],
			},
		});

		const updatedRange = appendResponse.data.updates?.updatedRange ?? '';
		const updatedRowNumber = extractRowNumber(updatedRange);

		return {
			found: false,
			created: true,
			row: updatedRowNumber,
			updates: appendResponse.data,
		};
	},
});

function extractRowNumber(updatedRange: string): number {
	const part = updatedRange.split('!')[1];
	if (!part) return 0;
	return parseInt(part.split(':')[0].substring(1), 10);
}
