import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { google } from 'googleapis';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
	objectToArray,
	stringifyArray,
	ValueInputOption,
} from '../common/common';
import { commonProps, isFirstRowHeaderProp, rowValuesProp } from '../common/props';
import { getWorkSheetName } from '../triggers/helpers';

export const insertRowAtTopAction = createAction({
	auth: googleSheetsAuth,
	name: 'insert-row-at-top',
	displayName: 'Add Row at Top',
	description: 'Inserts a new row at the top of a worksheet, just below the header row.',
	props: {
		...commonProps,
		first_row_headers: isFirstRowHeaderProp(),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect.',
			required: false,
		}),
		insertAfterRow: Property.Number({
			displayName: 'Insert After Row',
			description:
				'The row above which the new row will be inserted. Defaults to 1 (insert right under row 1, which is the header in most sheets).',
			required: false,
			defaultValue: 1,
		}),
		values: rowValuesProp(),
	},
	async run({ auth, propsValue }) {
		const {
			spreadsheetId: inputSpreadsheetId,
			sheetId: inputSheetId,
			as_string,
			first_row_headers,
			insertAfterRow,
			values,
		} = propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const spreadsheetId = inputSpreadsheetId as string;
		const sheetId = Number(inputSheetId);

		const afterRow = insertAfterRow && insertAfterRow > 0 ? insertAfterRow : 1;
		const targetRow = afterRow + 1;

		const formattedValues = first_row_headers
			? objectToArray(values).map((val) => (isNil(val) ? '' : val))
			: (values.values as unknown[]);

		const sheetName = await getWorkSheetName(auth, spreadsheetId, sheetId);
		const authClient = await createGoogleClient(auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		await sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: {
				requests: [
					{
						insertDimension: {
							range: {
								sheetId,
								dimension: 'ROWS',
								startIndex: afterRow,
								endIndex: afterRow + 1,
							},
							inheritFromBefore: afterRow > 0,
						},
					},
				],
			},
		});

		const updateResponse = await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `${sheetName}!A${targetRow}:ZZZ${targetRow}`,
			valueInputOption: as_string ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED,
			requestBody: {
				majorDimension: Dimension.ROWS,
				values: [stringifyArray(formattedValues)],
			},
		});

		return {
			row: targetRow,
			updates: updateResponse.data,
		};
	},
});
