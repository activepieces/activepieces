import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { areSheetIdsValid, createGoogleClient, Dimension, googleSheetsAuth } from '../common/common';

export const sheetsInsertDimension = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_insert_dimension',
	displayName: 'Insert Rows/Columns',
	description: 'Insert blank rows or columns at a position, shifting existing data.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Inserts blank rows or columns at a position, shifting existing data. Use to make space mid-sheet; to add a column WITH a header name use sheets_add_column, and to append at the end use sheets_append_dimension. Indices are 0-based half-open. Not idempotent — each call inserts more.',
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
			description: 'Whether to insert rows or columns.',
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
				'Where to start inserting, 0-based and inclusive. Index 0 = before the first row/column (row 1 / column A). The range is half-open: [start, end).',
			required: true,
		}),
		end_index: Property.Number({
			displayName: 'End Index (0-based, exclusive)',
			description:
				'The index just past the last inserted row/column (exclusive). The number inserted is (end - start): to insert 1 use start N, end N+1; to insert 3 at the top use start 0, end 3.',
			required: true,
		}),
		inherit_from_before: Property.Checkbox({
			displayName: 'Inherit Formatting From Before',
			description:
				'When true, new rows/columns inherit formatting from the row/column before them; when false (default), from the one after.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, dimension, start_index, end_index, inherit_from_before } =
			context.propsValue;

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
						insertDimension: {
							range: {
								sheetId: sheet_id,
								dimension,
								startIndex: start_index,
								endIndex: end_index,
							},
							inheritFromBefore: inherit_from_before ?? false,
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
