import { createAction, Property } from '@activepieces/pieces-framework';
import { areSheetIdsValid, createGoogleClient, googleSheetsAuth } from '../common/common';
import { sheets as googleSheets } from '@googleapis/sheets';
import { isNil } from '@activepieces/pieces-framework';

export const sheetsFormatCells = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_format_cells',
	displayName: 'Format Cells',
	description: 'Apply formatting to a range of rows in a worksheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Applies cell formatting (background color, text color, bold, italic, strikethrough) to a range of rows, leaving cell values untouched. Colors are HEX codes. Use to style rows rather than change data. Safe to retry — re-applying the same formatting converges.',
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
		starting_row: Property.Number({
			displayName: 'Starting row',
			description: 'The first row number where formatting should begin (1-based).',
			required: true,
		}),
		ending_row: Property.Number({
			displayName: 'Ending row',
			description:
				'The last row number where formatting should stop (leave empty to format only the starting row).',
			required: false,
		}),
		bg_color: Property.ShortText({
			displayName: 'Background Color',
			description: 'Provide a HEX color code (example: #FFD966).',
			required: false,
		}),
		text_color: Property.ShortText({
			displayName: 'Text Color',
			description: 'Provide a HEX color code (example: #FFD966).',
			required: false,
		}),
		bold: Property.Checkbox({
			displayName: 'Make text bold',
			required: false,
		}),
		italic: Property.Checkbox({
			displayName: 'Make text Italic',
			required: false,
		}),
		strikethrough: Property.Checkbox({
			displayName: 'Make text Strikethrough',
			required: false,
		}),
	},
	async run(context) {
		const {
			spreadsheet_id,
			sheet_id,
			starting_row,
			ending_row,
			bg_color,
			text_color,
			italic,
			bold,
			strikethrough,
		} = context.propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet_id,
			requestBody: {
				requests: [
					{
						repeatCell: {
							range: {
								sheetId: sheet_id,
								startRowIndex: starting_row - 1,
								endRowIndex: ending_row ? ending_row : starting_row,
							},
							cell: {
								userEnteredFormat: {
									backgroundColor: hexToRgb(bg_color),
									textFormat: {
										bold,
										italic,
										strikethrough,
										foregroundColor: hexToRgb(text_color),
									},
								},
							},
							fields: 'userEnteredFormat(backgroundColor,textFormat)',
						},
					},
				],
			},
		});

		return {
			success: true,
			...response.data,
		};
	},
});

function hexToRgb(hex?: string) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	if (isNil(hex)) return undefined;
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	// The Sheets Color API expects each channel as a float in [0.0, 1.0],
	// so divide the parsed 0–255 ints by 255 (bug fix vs. the source action).
	return result
		? {
				red: parseInt(result[1], 16) / 255,
				green: parseInt(result[2], 16) / 255,
				blue: parseInt(result[3], 16) / 255,
		  }
		: undefined;
}
