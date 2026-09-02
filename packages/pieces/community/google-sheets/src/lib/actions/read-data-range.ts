import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
} from '../common/common';
import { commonProps } from '../common/props';
import { getWorkSheetName } from '../triggers/helpers';
import { readDataRangeActionOutputSchema } from '../output-schemas';

export const readDataRangeAction = createAction({
	auth: googleSheetsAuth,
	name: 'read-data-range',
	classification: 'READ',
	displayName: 'Read Data Range',
	description:
		'Read cells from a range using A1 notation (e.g. A1:D10). Returns rows and the resolved range.',
	audience: 'human',
	aiMetadata: {
		description:
			'Reads raw cell values from a worksheet using an A1-notation range, where leaving the range empty reads the entire worksheet, with switchable orientation (one array per row or per column) and rendering (formatted text, unformatted values, or the underlying formulas). Use when an agent needs a specific block of cells or the formulas behind them; prefer Get All Rows or Find Rows when header-keyed row objects are wanted instead of positional arrays. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		...commonProps,
		range: Property.ShortText({
			displayName: 'Range (A1 Notation)',
			description:
				'The cell range to read, e.g. A1:D10. Leave empty to read the entire worksheet.',
			required: false,
		}),
		majorDimension: Property.StaticDropdown({
			displayName: 'Return Data As',
			description: 'Group the results one array per row, or one array per column.',
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
			displayName: 'Cell Values',
			description: 'Return cells the way the sheet displays them, the underlying raw values, or the formulas behind them.',
			required: true,
			defaultValue: 'FORMATTED_VALUE',
			options: {
				disabled: false,
				options: [
					{ label: 'As displayed', value: 'FORMATTED_VALUE' },
					{ label: 'Raw values', value: 'UNFORMATTED_VALUE' },
					{ label: 'Formulas', value: 'FORMULA' },
				],
			},
		}),
	},
	outputSchema: readDataRangeActionOutputSchema,
	async run({ auth, propsValue }) {
		const { spreadsheetId, sheetId, range, majorDimension, valueRenderOption } = propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const sheetName = await getWorkSheetName(auth, spreadsheetId as string, sheetId as number);
		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

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
