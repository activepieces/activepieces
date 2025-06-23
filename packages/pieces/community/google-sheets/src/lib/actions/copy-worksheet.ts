import { googleSheetsAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { includeTeamDrivesProp, sheetIdProp, spreadsheetIdProp } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const copyWorksheetAction = createAction({
	auth: googleSheetsAuth,
	name: 'copy-worksheet',
	displayName: 'Copy Worksheet',
	description: 'Creates a new worksheet by copying an existing one.',
	props: {
		includeTeamDrives: includeTeamDrivesProp(),
		spreadsheetId: spreadsheetIdProp('Spreadsheet Containing the Worksheet to Copy', ''),
		sheetId: sheetIdProp('Worksheet to Copy', ''),
		desinationSpeadsheetId: spreadsheetIdProp('Spreadsheet to paste in', ''),
	},
	async run(context) {
		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);

		const sheets = google.sheets({ version: 'v4', auth: authClient });

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
