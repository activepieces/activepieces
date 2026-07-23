import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { areSheetIdsValid, createGoogleClient, googleSheetsAuth } from '../common/common';
import { getWorkSheetName } from '../triggers/helpers';

export const sheetsClearValues = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_clear_values',
	displayName: 'Clear Cell Range',
	description: 'Clear the contents of one or more rows without removing the rows themselves.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Clears the contents of one or more rows over an A1 range without removing the rows themselves (formatting and references stay stable). Use to blank cells while keeping row structure; to remove rows entirely use sheets_delete_multiple_rows, and to drop a whole tab\'s data use the structural delete atomics. Safe to retry — re-clearing an empty range is a no-op.',
		idempotent: true,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Spreadsheet ID',
			description:
				'The ID of the spreadsheet (the Drive file id). Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		sheet_id: Property.Number({
			displayName: 'Worksheet ID',
			description:
				'The numeric worksheet (tab) id. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		starting_row: Property.Number({
			displayName: 'Starting Row',
			description: 'The first row to clear (1-based).',
			required: true,
			defaultValue: 2,
		}),
		ending_row: Property.Number({
			displayName: 'Ending Row',
			description: 'The last row to clear. Leave empty to only clear the starting row.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheet_id, sheet_id, starting_row, ending_row } = propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		if (starting_row < 1) {
			throw new Error('Starting row must be 1 or greater.');
		}

		const effectiveEndingRow =
			ending_row && ending_row >= starting_row ? ending_row : starting_row;

		const sheetName = await getWorkSheetName(auth, spreadsheet_id as string, sheet_id as number);
		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.values.clear({
			spreadsheetId: spreadsheet_id as string,
			range: `${sheetName}!A${starting_row}:ZZZ${effectiveEndingRow}`,
		});

		return {
			success: true,
			startingRow: starting_row,
			endingRow: effectiveEndingRow,
			clearedRange: response.data.clearedRange,
		};
	},
});
