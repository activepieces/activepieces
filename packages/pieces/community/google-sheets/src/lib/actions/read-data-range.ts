import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
} from '../common/common';
import { commonProps } from '../common/props';
import { getWorkSheetName } from '../triggers/helpers';

export const readDataRangeAction = createAction({
	auth: googleSheetsAuth,
	name: 'read-data-range',
	displayName: 'Read Data Range',
	description:
		'Read cells from a range using A1 notation (e.g. A1:D10). Returns rows and the resolved range.',
	props: {
		...commonProps,
		range: Property.ShortText({
			displayName: 'Range (A1 Notation)',
			description:
				'The cell range to read, e.g. A1:D10. Leave empty to read the entire worksheet.',
			required: false,
		}),
		majorDimension: Property.StaticDropdown({
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
		valueRenderOption: Property.StaticDropdown({
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
		const { spreadsheetId, sheetId, range, majorDimension, valueRenderOption } = propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const sheetName = await getWorkSheetName(auth, spreadsheetId as string, sheetId as number);
		const authClient = await createGoogleClient(auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const a1Range = range && range.trim().length > 0 ? `${sheetName}!${range}` : sheetName;

		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: spreadsheetId as string,
			range: a1Range,
			majorDimension,
			valueRenderOption: valueRenderOption as
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
