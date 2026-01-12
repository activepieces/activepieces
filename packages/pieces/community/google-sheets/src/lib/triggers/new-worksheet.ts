import { googleSheetsAuth } from '../common/common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { isNil } from '@activepieces/shared';
import { includeTeamDrivesProp, spreadsheetIdProp } from '../common/props';
import { createGoogleClient } from '../common/common';

export const newWorksheetTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'new-worksheet',
	displayName: 'New Worksheet',
	description: 'Triggers when a worksheet is created in a spreadsheet.',
	type: TriggerStrategy.POLLING,
	props: {
		includeTeamDrives: includeTeamDrivesProp(),
		spreadsheetId: spreadsheetIdProp('Spreadsheet', '',true),
	},
	async onEnable(context) {
		const ids: number[] = [];
		const authClient = await createGoogleClient(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });
		const response = await sheets.spreadsheets.get({
			spreadsheetId: context.propsValue.spreadsheetId as string,
		});
		if (response.data.sheets) {
			for (const sheet of response.data.sheets) {
				const sheetId = sheet.properties?.sheetId;
				if (sheetId) {
					ids.push(sheetId);
				}
			}
		}
		await context.store.put('worksheets', JSON.stringify(ids));
	},
	async onDisable(context) {
		await context.store.delete('worksheets');
	},
	async test(context) {
		const worksheets = [];
		const authClient = await createGoogleClient(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });
		const response = await sheets.spreadsheets.get({
			spreadsheetId: context.propsValue.spreadsheetId as string,
		});

		if (response.data.sheets) {
			for (const sheet of response.data.sheets) {
				worksheets.push(sheet);
			}
		}
		return worksheets;
	},
	async run(context) {
		const existingIds = (await context.store.get<string>('worksheets')) ?? '[]';
		const parsedExistingIds = JSON.parse(existingIds) as number[];

		const authClient = await createGoogleClient(context.auth);

		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.get({
			spreadsheetId: context.propsValue.spreadsheetId as string,
		});
		if (isNil(response.data.sheets) || response.data.sheets.length === 0) {
			return [];
		}
		// Filter valid worksheetss
		const newWorksheets = response.data.sheets.filter((sheet) => {
			const sheetId = sheet.properties?.sheetId ?? undefined;
			return sheetId !== undefined && !parsedExistingIds.includes(sheetId);
		});

		const newIds = newWorksheets
			.map((sheet) => sheet.properties?.sheetId ?? undefined)
			.filter((id): id is number => id !== undefined);

		if (newIds.length === 0) {
			return [];
		}
		// Store new IDs
		await context.store.put('worksheets', JSON.stringify([...newIds, ...parsedExistingIds]));
		return newWorksheets;
	},
	sampleData: {
		properties: {
			sheetId: 2077270595,
			title: 'Sheet5',
			index: 1,
			sheetType: 'GRID',
			gridProperties: {
				rowCount: 1000,
				columnCount: 26,
			},
		},
	},
});
