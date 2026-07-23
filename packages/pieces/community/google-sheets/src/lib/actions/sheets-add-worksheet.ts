import { createAction, Property } from '@activepieces/pieces-framework';
import { createGoogleClient, googleSheetsAuth } from '../common/common';
import { sheets as googleSheets } from '@googleapis/sheets';

export const sheetsAddWorksheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_add_worksheet',
	displayName: 'Add Worksheet',
	description: 'Create a new blank worksheet with a title.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds a new worksheet (tab) to a spreadsheet, optionally seeding a header row. Use when an agent needs another tab; to find-or-reuse a tab by title use sheets_find_or_create_worksheet. Not idempotent — each call adds a separate tab even if the title already exists.',
		idempotent: false,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Spreadsheet ID',
			description:
				'The ID of the spreadsheet (the Drive file id). Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the new worksheet.',
			required: true,
		}),
		headers: Property.Array({
			displayName: 'Headers',
			description: 'Optional column headers to seed into the first row of the new worksheet.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheet_id, title } = context.propsValue;
		const headers = (context.propsValue.headers as string[]) ?? [];
		const client = await createGoogleClient(context.auth);
		const sheetsApi = googleSheets({ version: 'v4', auth: client });
		const sheet = await sheetsApi.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet_id,
			requestBody: {
				requests: [
					{
						addSheet: {
							properties: {
								title: title,
							},
						},
					},
				],
			},
		});
		const addHeadersResponse = await sheetsApi.spreadsheets.values.append({
			spreadsheetId: spreadsheet_id,
			range: `${title}!A1`,
			valueInputOption: 'RAW',
			requestBody: {
				majorDimension: 'ROWS',
				values: [headers],
			},
		});

		return {
			id: sheet.data?.replies?.[0]?.addSheet?.properties?.sheetId,
			...addHeadersResponse.data,
		};
	},
});
