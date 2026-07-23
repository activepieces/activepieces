import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { areSheetIdsValid, createGoogleClient, Dimension, googleSheetsAuth } from '../common/common';

export const sheetsDeleteDimension = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_delete_dimension',
	displayName: 'Delete Rows/Columns',
	description: 'Delete a range of rows or columns, shifting the rest.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes a range of rows or columns, shifting the rest. Use to remove whole columns (which the row-delete atomics cannot) or a row range by 0-based index. For deleting rows by 1-based row number prefer sheets_delete_multiple_rows. Not idempotent — indices shift after deletion.',
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
			description: 'Whether to delete rows or columns.',
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
		start_index: Property.Number({
			displayName: 'Start Index (0-based)',
			description:
				'The first row/column to delete, 0-based and inclusive. Row 1 / column A is index 0, so deleting "row 5" means start 4. The range is half-open: [start, end).',
			required: true,
		}),
		end_index: Property.Number({
			displayName: 'End Index (0-based, exclusive)',
			description:
				'The index just past the last deleted row/column (exclusive). To delete only row 5 use start 4, end 5; to delete rows 5–7 use start 4, end 7.',
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
						deleteDimension: {
							range: {
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
