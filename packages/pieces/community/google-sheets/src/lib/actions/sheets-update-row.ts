import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
	objectToArray,
	ValueInputOption,
} from '../common/common';
import { getWorkSheetName } from '../triggers/helpers';
import { sheets as googleSheets } from '@googleapis/sheets';
import { isString } from '@activepieces/pieces-framework';

export const sheetsUpdateRow = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_update_row',
	displayName: 'Update Row',
	description: 'Update the data in an existing row, identified by its row number.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Overwrites the cells of one existing row, identified by its row number, mapping values to columns positionally or by header name. Use when you already know the target row (e.g. from sheets_find_rows); empty values skip (do not clear) cells. Safe to retry — re-running with the same row and values converges.',
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
		row_id: Property.Number({
			displayName: 'Row Number',
			description: 'The row number to update.',
			required: true,
		}),
		first_row_headers: Property.Checkbox({
			displayName: 'Values Keyed by Column Letter',
			description:
				'When true, "values" is an object keyed by column letter, e.g. {"A":"x","B":"y"}. When false, "values" is a positional array, e.g. ["x","y"] mapped to columns A, B, … in order.',
			required: true,
			defaultValue: false,
		}),
		values: Property.Json({
			displayName: 'Values',
			description:
				'The row values. If "Values Keyed by Column Letter" is on, pass an object like {"A":"x","B":"y"}; otherwise pass an array like ["x","y"]. Empty strings skip (do not clear) the cell.',
			required: true,
		}),
	},
	async run(context) {
		const inputSpreadsheetId = context.propsValue.spreadsheet_id;
		const inputSheetId = context.propsValue.sheet_id;
		const rowId = context.propsValue.row_id;
		const isFirstRowHeaders = context.propsValue.first_row_headers;
		const rowValuesInput = context.propsValue.values as any;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const authClient = await createGoogleClient(context.auth);

		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);

		// replace empty string with null to skip the cell value
		const formattedValues = (
			isFirstRowHeaders ? objectToArray(rowValuesInput) : (rowValuesInput as unknown[])
		).map((value: string | null | undefined) => {
			if (value === '' || value === null || value === undefined) {
				return null;
			}
			if (isString(value)) {
				return value;
			}
			return JSON.stringify(value, null, 2);
		});

		if (formattedValues.length > 0) {
			const response = await sheets.spreadsheets.values.update({
				range: `${sheetName}!A${rowId}:ZZZ${rowId}`,
				spreadsheetId: spreadsheetId,
				valueInputOption: ValueInputOption.USER_ENTERED,
				requestBody: {
					values: [formattedValues],
					majorDimension: Dimension.ROWS,
				},
			});

			//Split the updatedRange string to extract the row number
			const updatedRangeParts = response.data.updatedRange?.split('!');
			const updatedRowRange = updatedRangeParts?.[1];
			const updatedRowNumber = parseInt(
				updatedRowRange?.split(':')[0].substring(1) ?? '0',
				10,
			);

			return { updates: { ...response.data }, row: updatedRowNumber };
		} else {
			throw Error('Values passed are empty or not array ' + JSON.stringify(formattedValues));
		}
	},
});
