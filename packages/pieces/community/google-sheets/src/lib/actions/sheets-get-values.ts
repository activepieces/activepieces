import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient, Dimension, googleSheetsAuth } from '../common/common';

export const sheetsGetValues = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_get_values',
	displayName: 'Read Cell Range',
	description: 'Read cell values from a worksheet using A1 notation.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads cell values from a worksheet using A1 notation (e.g. A1:D10), returning a 2D array of rows or columns. Use when you have explicit cell coordinates; to look up rows by a column value use sheets_find_rows, and to read by row number use sheets_get_row. The worksheet title must match the tab name exactly. Read-only.',
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
				'The exact tab title to read from. Must match the tab name exactly (including spacing/case). Resolve via sheets_get_spreadsheet or sheets_find_worksheet.',
			required: true,
		}),
		range: Property.ShortText({
			displayName: 'Range (A1 Notation)',
			description:
				'The cell range to read, e.g. A1:D10. Leave empty to read the entire worksheet.',
			required: false,
		}),
		major_dimension: Property.StaticDropdown({
			displayName: 'Major Dimension',
			description:
				'Whether to return rows (default) or columns. "ROWS" returns one array per row; "COLUMNS" returns one array per column.',
			required: true,
			defaultValue: Dimension.ROWS,
			options: {
				disabled: false,
				options: [
					{ label: 'Rows', value: Dimension.ROWS },
					{ label: 'Columns', value: Dimension.COLUMNS },
				],
			},
		}),
		value_render_option: Property.StaticDropdown({
			displayName: 'Value Render Option',
			description: 'How values should be represented in the output.',
			required: true,
			defaultValue: 'FORMATTED_VALUE',
			options: {
				disabled: false,
				options: [
					{ label: 'Formatted Value', value: 'FORMATTED_VALUE' },
					{ label: 'Unformatted Value', value: 'UNFORMATTED_VALUE' },
					{ label: 'Formula', value: 'FORMULA' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheet_id, worksheet_title, range, major_dimension, value_render_option } =
			propsValue;

		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const a1Range =
			range && range.trim().length > 0 ? `${worksheet_title}!${range}` : worksheet_title;

		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: spreadsheet_id,
			range: a1Range,
			majorDimension: major_dimension,
			valueRenderOption: value_render_option as
				| 'FORMATTED_VALUE'
				| 'UNFORMATTED_VALUE'
				| 'FORMULA',
		});

		return {
			range: response.data.range,
			majorDimension: response.data.majorDimension,
			values: response.data.values ?? [],
		};
	},
});
