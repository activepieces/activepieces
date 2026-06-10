import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { areSheetIdsValid, createGoogleClient, googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';

export const deleteMultipleRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'delete-multiple-rows',
	displayName: 'Delete Multiple Rows',
	description:
		'Deletes a contiguous range of rows, or a list of specific row numbers. Row numbers are 1-based.',
	props: {
		...commonProps,
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
		startingRow: Property.Number({
			displayName: 'Starting Row',
			description: 'First row to delete (used in "Contiguous Range" mode).',
			required: false,
		}),
		endingRow: Property.Number({
			displayName: 'Ending Row',
			description: 'Last row to delete (used in "Contiguous Range" mode).',
			required: false,
		}),
		rowNumbers: Property.ShortText({
			displayName: 'Row Numbers',
			description:
				'Comma-separated row numbers to delete (used in "Specific Row Numbers" mode), e.g. "3, 5, 8".',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { spreadsheetId, sheetId, mode, startingRow, endingRow, rowNumbers } = propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const numericSheetId = sheetId as number;
		const authClient = await createGoogleClient(auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const deletionRanges = buildDeletionRanges({ mode, startingRow, endingRow, rowNumbers });

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
			spreadsheetId: spreadsheetId as string,
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
