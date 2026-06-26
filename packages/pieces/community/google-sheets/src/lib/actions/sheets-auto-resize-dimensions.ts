import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { areSheetIdsValid, createGoogleClient, Dimension, googleSheetsAuth } from '../common/common';

export const sheetsAutoResizeDimensions = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_auto_resize_dimensions',
	displayName: 'Auto-Resize Columns/Rows',
	description: 'Auto-fit the width of columns or height of rows to their content.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Auto-fits the width of columns (or height of rows) to their content over a range. Use after writing data to make it readable. Indices are 0-based and half-open [start,end). Safe to retry — re-fitting produces the same result.',
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
				'The numeric worksheet (tab) id (gid). Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		dimension: Property.StaticDropdown({
			displayName: 'Dimension',
			description: 'Whether to auto-resize columns (width) or rows (height).',
			required: true,
			defaultValue: Dimension.COLUMNS,
			options: {
				disabled: false,
				options: [
					{ label: 'Columns', value: Dimension.COLUMNS },
					{ label: 'Rows', value: Dimension.ROWS },
				],
			},
		}),
		start_index: Property.Number({
			displayName: 'Start Index (0-based)',
			description:
				'The first column/row to resize, 0-based and inclusive. Column A / row 1 is index 0. The range is half-open: [start, end).',
			required: true,
		}),
		end_index: Property.Number({
			displayName: 'End Index (0-based, exclusive)',
			description:
				'The index just past the last column/row to resize (exclusive). To resize only column A use start 0, end 1; to resize A–C use start 0, end 3.',
			required: true,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, dimension, start_index, end_index } = context.propsValue;

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
						autoResizeDimensions: {
							dimensions: {
								sheetId: sheet_id,
								dimension,
								startIndex: start_index,
								endIndex: end_index,
							},
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
