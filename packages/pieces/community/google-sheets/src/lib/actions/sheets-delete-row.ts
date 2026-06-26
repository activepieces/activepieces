import { createAction, Property } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsAuth, googleSheetsCommon } from '../common/common';

export const sheetsDeleteRow = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_delete_row',
	displayName: 'Delete Row',
	description: 'Delete a single row by its row number.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Removes one row by its row number and shifts all rows below it up. Use to delete a single known row; for several rows use sheets_delete_multiple_rows. Not idempotent — because rows renumber after deletion, repeating the same row number deletes a different row, so re-resolve the row before any retry.',
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
				'The numeric worksheet (tab) id. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		row_id: Property.Number({
			displayName: 'Row Number',
			description: 'The number of the row you want to delete (1-based).',
			required: true,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, row_id } = context.propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		// Subtract 1 from the row_id to convert it to 0-indexed
		const adjustedRowIndex = row_id - 1;
		const response = await googleSheetsCommon.deleteRow(
			spreadsheet_id as string,
			sheet_id as number,
			adjustedRowIndex,
			context.auth,
		);

		return {
			success: true,
			body: response,
		};
	},
});
