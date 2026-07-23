import { googleSheetsAuth } from '../common/common';
import { createAction } from '@activepieces/pieces-framework';
import { includeTeamDrivesProp, sheetIdProp, spreadsheetIdProp } from '../common/props';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient } from '../common/common';
import { copyWorksheetActionOutputSchema } from '../output-schemas';

export const copyWorksheetAction = createAction({
	auth: googleSheetsAuth,
	name: 'copy-worksheet',
	displayName: 'Copy Worksheet',
	description: 'Creates a new worksheet by copying an existing one.',
	audience: 'human',
	aiMetadata: {
		description:
			'Copies an existing worksheet (tab), with its data, into a destination spreadsheet as a new worksheet. Use when an agent needs to duplicate a tab within or across spreadsheets. Not idempotent — each call creates another copy.',
		idempotent: false,
	},
	props: {
		includeTeamDrives: includeTeamDrivesProp(),
		spreadsheetId: spreadsheetIdProp('Spreadsheet Containing the Worksheet to Copy', ''),
		sheetId: sheetIdProp('Worksheet to Copy', ''),
		desinationSpeadsheetId: spreadsheetIdProp('Spreadsheet to paste in', ''),
	},
	outputSchema: copyWorksheetActionOutputSchema,
	async run(context) {
		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.sheets.copyTo({
			spreadsheetId: context.propsValue.spreadsheetId,
			sheetId: context.propsValue.sheetId,
			requestBody: {
				destinationSpreadsheetId: context.propsValue.desinationSpeadsheetId,
			},
		});

		return response.data;
	},
});
