import { googleSheetsAuth } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient } from '../common/common';

export const sheetsFindWorksheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_find_worksheet',
	displayName: 'Find Worksheets',
	description: 'Find a worksheet(s) by title.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches the worksheets (tabs) of a spreadsheet for ones whose title matches a query (exact or contains), returning each match\'s title and numeric sheet id. Use to resolve a tab name to its sheet_id; to list all tabs at once use sheets_get_spreadsheet. Read-only.',
		idempotent: true,
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
			description: 'The worksheet (tab) title to search for.',
			required: true,
		}),
		exact_match: Property.Checkbox({
			displayName: 'Exact Match',
			description:
				'If true, only return worksheets that exactly match the title. If false, return worksheets that contain it.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const spreadsheetId = context.propsValue.spreadsheet_id;
		const title = context.propsValue.title;
		const exactMatch = context.propsValue.exact_match ?? false;

		const authClient = await createGoogleClient(context.auth);

		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.get({
			spreadsheetId,
		});

		const sheetsData = response.data.sheets ?? [];

		const matchedSheets = sheetsData.filter((sheet) => {
			const sheetTitle = sheet.properties?.title ?? '';
			return exactMatch ? sheetTitle === title : sheetTitle.includes(title);
		});

		return {
			found: matchedSheets.length > 0,
			worksheets: matchedSheets,
		};
	},
});
