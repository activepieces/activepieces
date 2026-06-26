import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsGetSpreadsheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_get_spreadsheet',
	displayName: 'Get Spreadsheet Info',
	description: 'Fetch a spreadsheet\'s title and the list of its worksheets (tabs).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches a spreadsheet\'s metadata: its title and the list of worksheets (tabs) with each tab\'s title, numeric sheet id, and grid size. Use to resolve a tab name to its numeric sheet_id (which the structural atomics need) or to discover what tabs exist before reading them. Read-only.',
		idempotent: true,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Spreadsheet ID',
			description:
				'The ID of the spreadsheet (the Drive file id). Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		include_grid_data: Property.Checkbox({
			displayName: 'Include Grid Data',
			description:
				'When true, also returns the cell data for every worksheet. Leave off (default) for a lightweight metadata-only response.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheet_id, include_grid_data } = propsValue;

		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.get({
			spreadsheetId: spreadsheet_id,
			includeGridData: include_grid_data ?? false,
		});

		const worksheets = (response.data.sheets ?? []).map((sheet) => ({
			sheet_id: sheet.properties?.sheetId,
			title: sheet.properties?.title,
			index: sheet.properties?.index,
			sheet_type: sheet.properties?.sheetType,
			row_count: sheet.properties?.gridProperties?.rowCount,
			column_count: sheet.properties?.gridProperties?.columnCount,
		}));

		return {
			spreadsheet_id: response.data.spreadsheetId,
			title: response.data.properties?.title,
			locale: response.data.properties?.locale,
			time_zone: response.data.properties?.timeZone,
			url: response.data.spreadsheetUrl,
			worksheets,
			worksheet_count: worksheets.length,
		};
	},
});
