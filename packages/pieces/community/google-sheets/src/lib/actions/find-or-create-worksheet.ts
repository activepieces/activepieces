import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { createGoogleClient, googleSheetsAuth } from '../common/common';
import { includeTeamDrivesProp, spreadsheetIdProp } from '../common/props';

export const findOrCreateWorksheetAction = createAction({
	auth: googleSheetsAuth,
	name: 'find-or-create-worksheet',
	displayName: 'Find or Create Worksheet',
	description: 'Look up a worksheet by title in a spreadsheet; if not found, create it with optional headers.',
	props: {
		includeTeamDrives: includeTeamDrivesProp(),
		spreadsheetId: spreadsheetIdProp('Spreadsheet', 'The spreadsheet to look in.'),
		title: Property.ShortText({
			displayName: 'Worksheet Title',
			description: 'The title to look up. The match is exact and case-sensitive.',
			required: true,
		}),
		headers: Property.Array({
			displayName: 'Headers (Only Used When Creating)',
			description: 'Column headers to add to the new worksheet if it has to be created.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheetId, title } = context.propsValue;
		const headers = (context.propsValue.headers as string[]) ?? [];

		const authClient = await createGoogleClient(context.auth);
		const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

		const existing = await sheetsApi.spreadsheets.get({ spreadsheetId });
		const found = existing.data.sheets?.find((sheet) => sheet.properties?.title === title);

		if (found) {
			return {
				found: true,
				created: false,
				worksheet: found.properties,
			};
		}

		const addSheetResponse = await sheetsApi.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: {
				requests: [
					{
						addSheet: {
							properties: { title },
						},
					},
				],
			},
		});

		const newSheetProperties =
			addSheetResponse.data.replies?.[0]?.addSheet?.properties ?? undefined;

		if (headers.length > 0) {
			await sheetsApi.spreadsheets.values.append({
				spreadsheetId,
				range: `${title}!A1`,
				valueInputOption: 'RAW',
				requestBody: {
					majorDimension: 'ROWS',
					values: [headers],
				},
			});
		}

		return {
			found: false,
			created: true,
			worksheet: newSheetProperties,
		};
	},
});
