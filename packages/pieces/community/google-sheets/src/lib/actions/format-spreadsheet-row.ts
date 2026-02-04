import { createAction, Property } from '@activepieces/pieces-framework';
import { areSheetIdsValid, createGoogleClient } from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';
import { google } from 'googleapis';
import { isNil } from '@activepieces/shared';

export const formatRowAction = createAction({
	auth: googleSheetsAuth,
	name: 'format-row',
	description: 'Format one or multiple rows in specific spreadsheet.',
	displayName: 'Format Row(s)',
	props: {
		...commonProps,
		startingRow: Property.Number({
			displayName: 'Starting row',
			description: 'The first row number where formatting should begin.',
			required: true,
		}),
		endingRow: Property.Number({
			displayName: 'Ending row',
			description:
				'The last row number where formatting should stop (leave empty to format only the starting row).',
			required: false,
		}),
		bgColor: Property.ShortText({
			displayName: 'Background Color',
			description: 'Provide a HEX color code (example: #FFD966)',
			required: false,
		}),
		textColor: Property.ShortText({
			displayName: 'Text Color',
			description: 'Provide a HEX color code (example: #FFD966)',
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
		const { spreadsheetId, sheetId, startingRow,endingRow, bgColor, textColor, italic, bold, strikethrough } =
			context.propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const authClient = await createGoogleClient(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.batchUpdate({
			spreadsheetId: context.propsValue.spreadsheetId,
			requestBody: {
				requests: [
					{
						repeatCell: {
							range: {
								sheetId,
								startRowIndex: startingRow - 1,
								endRowIndex: endingRow ? endingRow : startingRow,
							},
							cell: {
								userEnteredFormat: {
									backgroundColor: hexToRgb(bgColor),
									textFormat: {
										bold,
										italic,
										strikethrough,
										foregroundColor: hexToRgb(textColor),
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
	return result
		? {
				red: parseInt(result[1], 16),
				green: parseInt(result[2], 16),
				blue: parseInt(result[3], 16),
		  }
		: undefined;
}
