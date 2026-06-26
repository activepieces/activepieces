import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsDeleteWorksheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_delete_worksheet',
	displayName: 'Delete Worksheet',
	description: 'Permanently delete a specific worksheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently removes one worksheet (tab) and all its data, identified by its numeric sheet id (resolve via sheets_get_spreadsheet). Destructive and not undoable. Use only when a whole tab should be dropped; to clear a tab\'s data but keep it use sheets_clear_values. A repeat call fails because the tab is gone.',
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
				'The numeric worksheet (tab) id to delete. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
	},
	async run(context) {
		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.batchUpdate({
			spreadsheetId: context.propsValue.spreadsheet_id,
			requestBody: {
				requests: [
					{
						deleteSheet: {
							sheetId: context.propsValue.sheet_id,
						},
					},
				],
			},
		});

		return response.data;
	},
});
