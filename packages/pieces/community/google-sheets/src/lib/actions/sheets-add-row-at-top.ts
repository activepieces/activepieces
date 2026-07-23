import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
	objectToArray,
	stringifyArray,
	ValueInputOption,
} from '../common/common';
import { getWorkSheetName } from '../triggers/helpers';

export const sheetsAddRowAtTop = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_add_row_at_top',
	displayName: 'Add Row at Top',
	description: 'Insert a new row near the top of a worksheet, just below the header row.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Inserts a new row near the top of a worksheet (default: just under the header row), shifting existing rows down. Use to prepend an entry; to append at the end use sheets_add_row. Not idempotent — each call inserts another row and renumbers rows below.',
		idempotent: false,
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
		first_row_headers: Property.Checkbox({
			displayName: 'Values Keyed by Column Letter',
			description:
				'When true, "values" is an object keyed by column letter, e.g. {"A":"x","B":"y"}. When false, "values" is a positional array, e.g. ["x","y"] mapped to columns A, B, … in order.',
			required: true,
			defaultValue: false,
		}),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect.',
			required: false,
		}),
		insert_after_row: Property.Number({
			displayName: 'Insert After Row',
			description:
				'The row above which the new row will be inserted. Defaults to 1 (insert right under row 1, which is the header in most sheets).',
			required: false,
			defaultValue: 1,
		}),
		values: Property.Json({
			displayName: 'Values',
			description:
				'The row values. If "Values Keyed by Column Letter" is on, pass an object like {"A":"x","B":"y"}; otherwise pass an array like ["x","y"].',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const {
			spreadsheet_id: inputSpreadsheetId,
			sheet_id: inputSheetId,
			as_string,
			first_row_headers,
			insert_after_row,
			values,
		} = propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const spreadsheetId = inputSpreadsheetId as string;
		const sheetId = Number(inputSheetId);

		const afterRow = insert_after_row && insert_after_row > 0 ? insert_after_row : 1;
		const targetRow = afterRow + 1;

		const formattedValues = first_row_headers
			? objectToArray(values as any).map((val) => (isNil(val) ? '' : val))
			: (values as unknown as unknown[]);

		const sheetName = await getWorkSheetName(auth, spreadsheetId, sheetId);
		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

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
