import { googleSheetsAuth } from '../common/common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { isNil } from '@activepieces/pieces-framework';
import { includeTeamDrivesProp, spreadsheetIdProp } from '../common/props';
import { createGoogleClient } from '../common/common';
import { newWorksheetTriggerOutputSchema } from '../output-schemas';

const FIRST_TAB_ID = 0;

export const newWorksheetTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'new-worksheet',
	classification: 'READ',
	displayName: 'New Worksheet',
	description: 'Triggers when a worksheet is created in a spreadsheet.',
	aiMetadata: {
		description:
			'Fires when a new worksheet (tab) is added to the selected spreadsheet, emitting one event per new worksheet with its sheet properties. Use to react to tabs being created within a specific spreadsheet. Polls periodically rather than in real time.',
	},
	type: TriggerStrategy.POLLING,
	props: {
		includeTeamDrives: includeTeamDrivesProp(),
		spreadsheetId: spreadsheetIdProp('Spreadsheet', 'The spreadsheet to watch for new worksheets.', true),
	},
	outputSchema: newWorksheetTriggerOutputSchema,
	async onEnable(context) {
		if (context.isRepublish && !isNil(await context.store.get('worksheets'))) {
			return;
		}
		const ids: number[] = [];
		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });
		const response = await sheets.spreadsheets.get({
			spreadsheetId: context.propsValue.spreadsheetId as string,
		});
		if (response.data.sheets) {
			for (const sheet of response.data.sheets) {
				const sheetId = sheet.properties?.sheetId;
				if (!isNil(sheetId)) {
					ids.push(sheetId);
				}
			}
		}
		await context.store.put('worksheets', JSON.stringify(ids));
	},
	async onDisable(context) {
		if (context.isRepublish) {
			return;
		}
		await context.store.delete('worksheets');
	},
	async test(context) {
		const worksheets = [];
		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });
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
		const existingIds = await context.store.get<string>('worksheets');

		const authClient = await createGoogleClient(context.auth);

		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.get({
			spreadsheetId: context.propsValue.spreadsheetId as string,
		});
		if (isNil(existingIds)) {
			const baseline = (response.data.sheets ?? [])
				.map((sheet) => sheet.properties?.sheetId)
				.filter((id): id is number => !isNil(id));
			console.info('[google-sheets] new_worksheet: no known worksheets for this flow, taking a new baseline.');
			await context.store.put('worksheets', JSON.stringify(baseline));
			return [];
		}
		const parsedIds: unknown = JSON.parse(existingIds);
		const parsedExistingIds = Array.isArray(parsedIds)
			? parsedIds.filter((id): id is number => typeof id === 'number')
			: [];
		if (isNil(response.data.sheets) || response.data.sheets.length === 0) {
			return [];
		}
		const hasFirstTab = response.data.sheets.some((sheet) => sheet.properties?.sheetId === FIRST_TAB_ID);
		const knownIds =
			hasFirstTab && !parsedExistingIds.includes(FIRST_TAB_ID)
				? [FIRST_TAB_ID, ...parsedExistingIds]
				: parsedExistingIds;
		const newWorksheets = response.data.sheets.filter((sheet) => {
			const sheetId = sheet.properties?.sheetId;
			return !isNil(sheetId) && !knownIds.includes(sheetId);
		});

		const newIds = newWorksheets
			.map((sheet) => sheet.properties?.sheetId)
			.filter((id): id is number => !isNil(id));

		if (newIds.length === 0) {
			if (knownIds !== parsedExistingIds) {
				await context.store.put('worksheets', JSON.stringify(knownIds));
			}
			return [];
		}
		await context.store.put('worksheets', JSON.stringify([...newIds, ...knownIds]));
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
