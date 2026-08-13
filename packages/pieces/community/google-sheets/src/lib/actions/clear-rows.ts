import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { areSheetIdsValid, createGoogleClient, googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';
import { getWorkSheetName } from '../triggers/helpers';
import { clearRowsActionOutputSchema } from '../output-schemas';

export const clearRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'clear-rows',
	displayName: 'Clear Row(s)',
	description:
		'Clears the contents of one or more rows without removing the rows themselves. Useful when you want to keep formatting and references stable.',
	audience: 'human',
	aiMetadata: {
		description:
			'Blanks the cell contents of one row or a contiguous row range in a worksheet without removing the rows, so row numbers and downstream references stay stable — prefer Delete Row or Delete Multiple Rows when the rows themselves should disappear, and Clear Sheet when the whole sheet should be emptied. Requires a selected spreadsheet and worksheet plus a 1-based starting row; leaving the ending row empty clears only that single row. Idempotent — re-running over the same range leaves it equally empty, but the erased values cannot be recovered.',
		idempotent: true,
	},
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
	outputSchema: clearRowsActionOutputSchema,
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
		const sheets = googleSheets({ version: 'v4', auth: authClient });

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
