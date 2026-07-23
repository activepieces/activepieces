import { googleSheetsAuth } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	objectToArray,
	ValueInputOption,
} from '../common/common';
import { isString } from '@activepieces/pieces-framework';
import { getWorkSheetName } from '../triggers/helpers';
import { sheets as googleSheets, sheets_v4 } from '@googleapis/sheets';

export const sheetsUpdateMultipleRows = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_update_multiple_rows',
	displayName: 'Update Multiple Rows',
	description: 'Update several existing rows in one batch call.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Overwrites several existing rows in one batch call, each targeted by its own row id. Use to edit multiple known rows efficiently rather than calling sheets_update_row repeatedly; rows without a row id are skipped. Safe to retry — same row ids and values converge.',
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
		header_row: Property.Number({
			displayName: 'Header Row',
			description: 'Which row contains the headers?',
			required: true,
			defaultValue: 1,
		}),
		values: Property.Json({
			displayName: 'Values',
			description:
				'An array of row objects, each with a numeric "rowId" plus cells keyed by column letter, e.g. [{"rowId":2,"A":"x","B":"y"},{"rowId":5,"A":"z"}]. Rows without a rowId are skipped.',
			required: true,
		}),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect.',
			required: false,
		}),
	},
	async run(context) {
		const {
			spreadsheet_id: inputSpreadsheetId,
			sheet_id: inputSheetId,
			values: rowValuesInput,
			as_string: asString,
		} = context.propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const valueInputOption = asString ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED;

		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const values: sheets_v4.Schema$ValueRange[] = [];

		for (const row of rowValuesInput as unknown as Array<Record<string, any>>) {
			const { rowId, ...rowValues } = row;
			if (rowId === undefined || rowId === null) {
				continue;
			}

			const formattedValues = objectToArray(rowValues).map(
				(value: string | null | undefined) => {
					if (value === '' || value === null || value === undefined) {
						return null;
					}
					if (isString(value)) {
						return value;
					}
					return JSON.stringify(value, null, 2);
				},
			);

			if (formattedValues.length === 0) {
				continue;
			}

			values.push({
				range: `${sheetName}!A${rowId}:ZZZ${rowId}`,
				majorDimension: Dimension.ROWS,
				values: [formattedValues],
			});
		}

		const response = await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId: spreadsheetId,
			requestBody: {
				valueInputOption: valueInputOption,
				data: values,
			},
		});

		return response.data;
	},
});
