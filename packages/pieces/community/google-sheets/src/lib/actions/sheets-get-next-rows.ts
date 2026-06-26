import {
	Property,
	Store,
	StoreScope,
	createAction,
} from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	googleSheetsAuth,
	GoogleSheetsAuthValue,
	googleSheetsCommon,
	mapRowsToHeaderNames,
} from '../common/common';
import { isNil } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import * as z from 'zod/mini';
import { propsValidation } from '@activepieces/pieces-common';
import { getWorkSheetGridSize } from '../triggers/helpers';

async function getRows(
	store: Store,
	auth: GoogleSheetsAuthValue,
	spreadsheetId: string,
	sheetId: number,
	memKey: string,
	groupSize: number,
	startRow: number,
	headerRow: number,
	useHeaderNames: boolean,
	testing: boolean,
) {
	const sheetGridRange = await getWorkSheetGridSize(auth, spreadsheetId, sheetId);
	const existingGridRowCount = sheetGridRange.rowCount ?? 0;
	const memVal = await store.get(memKey, StoreScope.FLOW);

	let startingRow;
	if (isNil(memVal) || memVal === '') startingRow = startRow || 1;
	else {
		startingRow = parseInt(memVal as string);
		if (isNaN(startingRow)) {
			throw Error(
				'The value stored in memory key : ' +
					memKey +
					' is ' +
					memVal +
					' and it is not a number',
			);
		}
	}

	if (startingRow < 1)
		throw Error('Starting row : ' + startingRow + ' is less than 1' + memVal);

	if (startingRow > existingGridRowCount - 1) {
		return [];
	}

	const endRow = Math.min(startingRow + groupSize, existingGridRowCount);

	if (testing == false) await store.put(memKey, endRow, StoreScope.FLOW);

	const row = await googleSheetsCommon.getGoogleSheetRows({
		auth,
		sheetId: sheetId,
		spreadsheetId: spreadsheetId,
		rowIndex_s: startingRow,
		rowIndex_e: endRow - 1,
		headerRow: headerRow,
	});

	if (row.length == 0) {
		const allRows = await googleSheetsCommon.getGoogleSheetRows({
			spreadsheetId: spreadsheetId,
			auth,
			sheetId: sheetId,
			rowIndex_s: undefined,
			rowIndex_e: undefined,
			headerRow: headerRow,
		});
		const lastRow = allRows.length + 1;
		if (testing == false) await store.put(memKey, lastRow, StoreScope.FLOW);
	}

	const finalRows = await mapRowsToHeaderNames(
		row,
		useHeaderNames,
		spreadsheetId,
		sheetId,
		headerRow,
		auth,
	);

	return finalRows;
}

export const sheetsGetNextRows = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_get_next_rows',
	displayName: 'Get Next Rows (Paginated)',
	description: 'Get the next group of rows from a worksheet, advancing a stored cursor.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads the next batch of rows from a worksheet, advancing a cursor stored under a memory key so successive runs walk the sheet without reprocessing rows. Use to iterate a large sheet in chunks across flow runs; for a one-shot full read use sheets_get_all_rows. Not idempotent — each non-test call moves the stored cursor forward.',
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
		start_row: Property.Number({
			displayName: 'Start Row',
			description: 'Which row to start from on the first run (before the cursor advances).',
			required: true,
			defaultValue: 1,
		}),
		header_row: Property.Number({
			displayName: 'Header Row',
			description: 'Which row contains the headers?',
			required: true,
			defaultValue: 1,
		}),
		use_header_names: Property.Checkbox({
			displayName: 'Use header names for keys',
			description: 'Map A/B/C… to the actual column headers (row specified above).',
			required: false,
			defaultValue: false,
		}),
		mem_key: Property.ShortText({
			displayName: 'Memory Key',
			description:
				'The key used to store the current row number in flow memory. Changing it starts the walk over.',
			required: true,
			defaultValue: 'row_number',
		}),
		group_size: Property.Number({
			displayName: 'Group Size',
			description: 'The number of rows to get per run.',
			required: true,
			defaultValue: 1,
		}),
	},
	async run({ store, auth, propsValue }) {
		const {
			start_row,
			group_size,
			mem_key,
			header_row,
			spreadsheet_id,
			sheet_id,
			use_header_names,
		} = propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		await propsValidation.validateZod(propsValue, {
			start_row: z.number().check(z.minimum(1)),
			group_size: z.number().check(z.minimum(1)),
		});

		try {
			return await getRows(
				store,
				auth,
				spreadsheet_id as string,
				sheet_id as number,
				mem_key,
				group_size,
				start_row,
				header_row,
				use_header_names as boolean,
				false,
			);
		} catch (error) {
			if (error instanceof HttpError) {
				const errorBody = error.response.body as any;
				throw new Error(errorBody['error']['message']);
			}
			throw error;
		}
	},
	async test({ store, auth, propsValue }) {
		const {
			start_row,
			group_size,
			mem_key,
			header_row,
			spreadsheet_id,
			sheet_id,
			use_header_names,
		} = propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		try {
			return await getRows(
				store,
				auth,
				spreadsheet_id as string,
				sheet_id as number,
				mem_key,
				group_size,
				start_row,
				header_row,
				use_header_names as boolean,
				true,
			);
		} catch (error) {
			if (error instanceof HttpError) {
				const errorBody = error.response.body as any;
				throw new Error(errorBody['error']['message']);
			}
			throw error;
		}
	},
});
