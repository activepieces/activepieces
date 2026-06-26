import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsCopyWorksheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_copy_worksheet',
	displayName: 'Copy Worksheet',
	description: 'Create a new worksheet by copying an existing one.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Copies a worksheet (with its data) into a destination spreadsheet as a new tab. Use to duplicate a tab within or across spreadsheets. Not idempotent — each call creates another copy (named "Copy of …").',
		idempotent: false,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Source Spreadsheet ID',
			description:
				'The ID of the spreadsheet containing the worksheet to copy. Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		sheet_id: Property.Number({
			displayName: 'Worksheet ID to Copy',
			description:
				'The numeric worksheet (tab) id to copy. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		destination_spreadsheet_id: Property.ShortText({
			displayName: 'Destination Spreadsheet ID',
			description: 'The ID of the spreadsheet to copy the worksheet into.',
			required: true,
		}),
	},
	async run(context) {
		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.sheets.copyTo({
			spreadsheetId: context.propsValue.spreadsheet_id,
			sheetId: context.propsValue.sheet_id,
			requestBody: {
				destinationSpreadsheetId: context.propsValue.destination_spreadsheet_id,
			},
		});

		return response.data;
	},
});
