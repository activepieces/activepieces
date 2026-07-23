import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import {
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
	ValueInputOption,
} from '../common/common';

export const sheetsUpdateValues = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_update_values',
	displayName: 'Write Cell Range',
	description: 'Write a 2D array of values into a worksheet at a specific A1 range.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Writes a 2D array of values into a worksheet at a specific A1 range, overwriting whatever is there. Use when you have explicit coordinates and a rectangular block of values; to update a row by its header-mapped fields use sheets_update_row, and to append rather than overwrite use sheets_append_values. The values array shape must match the target range. Safe to retry — re-writing the same range is a no-op.',
		idempotent: true,
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
				'The exact tab title to write to. Must match the tab name exactly (including spacing/case). Resolve via sheets_get_spreadsheet or sheets_find_worksheet.',
			required: true,
		}),
		range: Property.ShortText({
			displayName: 'Range (A1 Notation)',
			description:
				'The cell range to write to, e.g. A1:D10. The shape of the values array must match this range (a 1x1 range cannot accept a 2x2 array).',
			required: true,
		}),
		values: Property.Json({
			displayName: 'Values',
			description:
				'A 2D array of values, e.g. [["Name","Age"],["Alice",30]]. Each inner array is one row (when major dimension is ROWS) or one column (when COLUMNS).',
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
		major_dimension: Property.StaticDropdown({
			displayName: 'Major Dimension',
			description:
				'Whether each inner array of Values is a row (ROWS, default) or a column (COLUMNS).',
			required: false,
			defaultValue: Dimension.ROWS,
			options: {
				disabled: false,
				options: [
					{ label: 'Rows', value: Dimension.ROWS },
					{ label: 'Columns', value: Dimension.COLUMNS },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheet_id, worksheet_title, range, values, value_input_option, major_dimension } =
			propsValue;

		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const a1Range = `${quoteSheetTitle(worksheet_title)}!${range}`;

		const response = await sheets.spreadsheets.values.update({
			spreadsheetId: spreadsheet_id,
			range: a1Range,
			valueInputOption: value_input_option,
			requestBody: {
				majorDimension: (major_dimension ?? Dimension.ROWS) as string,
				values: values as unknown as unknown[][],
			},
		});

		return {
			updatedRange: response.data.updatedRange,
			updatedRows: response.data.updatedRows,
			updatedColumns: response.data.updatedColumns,
			updatedCells: response.data.updatedCells,
		};
	},
});

function quoteSheetTitle(title: string): string {
	return `'${title.replace(/'/g, "''")}'`;
}
