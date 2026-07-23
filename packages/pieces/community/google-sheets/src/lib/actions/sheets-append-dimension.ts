import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { areSheetIdsValid, createGoogleClient, Dimension, googleSheetsAuth } from '../common/common';

export const sheetsAppendDimension = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_append_dimension',
	displayName: 'Append Rows/Columns',
	description: 'Append blank rows or columns to the end of a worksheet\'s grid.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Appends N blank rows or columns to the end of a worksheet\'s grid (grows the grid, no shifting). Use to enlarge a sheet before a big write. Not idempotent — each call grows the grid further.',
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
				'The numeric worksheet (tab) id (gid). Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		dimension: Property.StaticDropdown({
			displayName: 'Dimension',
			description: 'Whether to append rows or columns.',
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
		length: Property.Number({
			displayName: 'Length',
			description: 'The number of blank rows or columns to append to the end of the grid.',
			required: true,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, dimension, length } = context.propsValue;

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
						appendDimension: {
							sheetId: sheet_id,
							dimension,
							length,
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
