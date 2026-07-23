import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsRenameWorksheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_rename_worksheet',
	displayName: 'Rename Worksheet',
	description: 'Rename a specific worksheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Changes the title of an existing worksheet, identified by its numeric sheet id (resolve via sheets_get_spreadsheet). Use to relabel a tab. Safe to retry — re-applying the same name is a no-op.',
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
				'The numeric worksheet (tab) id to rename. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		new_name: Property.ShortText({
			displayName: 'New Sheet Name',
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
						updateSheetProperties: {
							properties: {
								sheetId: context.propsValue.sheet_id,
								title: context.propsValue.new_name,
							},
							fields: 'title',
						},
					},
				],
			},
		});

		return response.data;
	},
});
