import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { areSheetIdsValid, createGoogleClient, googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';
import { getWorkSheetName } from '../triggers/helpers';

export const clearRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'clear-rows',
	displayName: 'Clear Row(s)',
	description:
		'Clears the contents of one or more rows without removing the rows themselves. Useful when you want to keep formatting and references stable.',
	props: {
		...commonProps,
		startingRow: Property.Number({
			displayName: 'Starting Row',
			description: 'The first row to clear.',
			required: true,
			defaultValue: 2,
		}),
		endingRow: Property.Number({
			displayName: 'Ending Row',
			description: 'The last row to clear. Leave empty to only clear the starting row.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheetId, sheetId, startingRow, endingRow } = propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		if (startingRow < 1) {
			throw new Error('Starting row must be 1 or greater.');
		}

		const effectiveEndingRow = endingRow && endingRow >= startingRow ? endingRow : startingRow;

		const sheetName = await getWorkSheetName(auth, spreadsheetId as string, sheetId as number);
		const authClient = await createGoogleClient(auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.values.clear({
			spreadsheetId: spreadsheetId as string,
			range: `${sheetName}!A${startingRow}:ZZZ${effectiveEndingRow}`,
		});

		return {
			success: true,
			startingRow,
			endingRow: effectiveEndingRow,
			clearedRange: response.data.clearedRange,
		};
	},
});
