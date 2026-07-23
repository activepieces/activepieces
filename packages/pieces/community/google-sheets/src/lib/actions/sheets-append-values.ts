import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient, googleSheetsAuth, ValueInputOption } from '../common/common';

export const sheetsAppendValues = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_append_values',
	displayName: 'Append Values (Raw)',
	description: 'Append rows of values after the last row with data in a worksheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Appends rows of values after the last row with data in a worksheet, as a raw 2D array. Use when you have explicit values and don\'t need header-to-column mapping; for header-aware single-row insert use sheets_add_row. Each call adds new rows, so retries duplicate.',
		idempotent: false,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Spreadsheet ID',
			description:
				'The ID of the spreadsheet (the Drive file id). Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		worksheet_title: Property.ShortText({
			displayName: 'Worksheet Title',
			description:
				'The exact tab title to append to. Must match the tab name exactly (including spacing/case). Resolve via sheets_get_spreadsheet or sheets_find_worksheet.',
			required: true,
		}),
		range: Property.ShortText({
			displayName: 'Range (A1 Notation)',
			description:
				'The A1 range that locates the table to append after, e.g. A1 or A:D. The API finds the last row with data inside this range and appends below it; it does not overwrite the range itself.',
			required: true,
		}),
		values: Property.Json({
			displayName: 'Values',
			description:
				'A 2D array of rows to append, e.g. [["Alice",30],["Bob",25]]. Each inner array is one new row.',
			required: true,
		}),
		value_input_option: Property.StaticDropdown({
			displayName: 'Value Input Option',
			description:
				'USER_ENTERED parses values like the Sheets UI (formulas, dates, numbers). RAW stores them verbatim as strings.',
			required: true,
			defaultValue: ValueInputOption.USER_ENTERED,
			options: {
				disabled: false,
				options: [
					{ label: 'User Entered', value: ValueInputOption.USER_ENTERED },
					{ label: 'Raw', value: ValueInputOption.RAW },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheet_id, worksheet_title, range, values, value_input_option } = propsValue;

		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const a1Range = `${quoteSheetTitle(worksheet_title)}!${range}`;

		const response = await sheets.spreadsheets.values.append({
			spreadsheetId: spreadsheet_id,
			range: a1Range,
			valueInputOption: value_input_option,
			insertDataOption: 'INSERT_ROWS',
			requestBody: {
				majorDimension: 'ROWS',
				values: values as unknown as unknown[][],
			},
		});

		return {
			updatedRange: response.data.updates?.updatedRange,
			updatedRows: response.data.updates?.updatedRows,
			updatedColumns: response.data.updates?.updatedColumns,
			updatedCells: response.data.updates?.updatedCells,
		};
	},
});

function quoteSheetTitle(title: string): string {
	return `'${title.replace(/'/g, "''")}'`;
}
