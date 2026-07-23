import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { areSheetIdsValid, createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsDeleteMultipleRows = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_delete_multiple_rows',
	displayName: 'Delete Multiple Rows',
	description: 'Delete a contiguous range of rows, or a list of specific row numbers.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes a contiguous range of rows or a comma-separated list of row numbers (1-based) in one batch. Use to remove several rows; the action deletes list rows in descending order so indices stay valid. Not idempotent — rows renumber after deletion.',
		idempotent: false,
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
		mode: Property.StaticDropdown({
			displayName: 'Mode',
			description:
				'Choose whether to delete a contiguous range (start/end) or a comma-separated list of row numbers.',
			required: true,
			defaultValue: 'range',
			options: {
				disabled: false,
				options: [
					{ label: 'Contiguous Range', value: 'range' },
					{ label: 'Specific Row Numbers', value: 'list' },
				],
			},
		}),
		starting_row: Property.Number({
			displayName: 'Starting Row',
			description: 'First row to delete (used in "Contiguous Range" mode).',
			required: false,
		}),
		ending_row: Property.Number({
			displayName: 'Ending Row',
			description: 'Last row to delete (used in "Contiguous Range" mode).',
			required: false,
		}),
		row_numbers: Property.ShortText({
			displayName: 'Row Numbers',
			description:
				'Comma-separated row numbers to delete (used in "Specific Row Numbers" mode), e.g. "3, 5, 8".',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheet_id, sheet_id, mode, starting_row, ending_row, row_numbers } = propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const numericSheetId = sheet_id as number;
		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const deletionRanges = buildDeletionRanges({
			mode,
			startingRow: starting_row,
			endingRow: ending_row,
			rowNumbers: row_numbers,
		});

		if (deletionRanges.length === 0) {
			throw new Error('No valid rows were provided to delete.');
		}

		const requests = deletionRanges.map(({ start, end }) => ({
			deleteDimension: {
				range: {
					sheetId: numericSheetId,
					dimension: 'ROWS',
					startIndex: start,
					endIndex: end,
				},
			},
		}));

		const response = await sheets.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet_id as string,
			requestBody: {
				requests,
			},
		});

		return {
			success: true,
			deletedRanges: deletionRanges.map(({ start, end }) => ({
				startRow: start + 1,
				endRow: end,
			})),
			replies: response.data.replies,
		};
	},
});

type BuildDeletionRangesParams = {
	mode: string;
	startingRow: number | undefined;
	endingRow: number | undefined;
	rowNumbers: string | undefined;
};

function buildDeletionRanges({
	mode,
	startingRow,
	endingRow,
	rowNumbers,
}: BuildDeletionRangesParams): { start: number; end: number }[] {
	if (mode === 'range') {
		if (!startingRow || startingRow < 1) {
			throw new Error('Starting row must be 1 or greater.');
		}
		const lastRow = endingRow && endingRow >= startingRow ? endingRow : startingRow;
		return [{ start: startingRow - 1, end: lastRow }];
	}

	if (!rowNumbers || rowNumbers.trim().length === 0) {
		throw new Error('Please provide a comma-separated list of row numbers.');
	}

	const parsed = rowNumbers
		.split(',')
		.map((token) => token.trim())
		.filter((token) => token.length > 0)
		.map((token) => parseInt(token, 10))
		.filter((n) => Number.isInteger(n) && n >= 1);

	if (parsed.length === 0) {
		throw new Error('No valid row numbers were parsed from the input.');
	}

	const sortedDesc = Array.from(new Set(parsed)).sort((a, b) => b - a);
	return sortedDesc.map((rowNumber) => ({ start: rowNumber - 1, end: rowNumber }));
}
