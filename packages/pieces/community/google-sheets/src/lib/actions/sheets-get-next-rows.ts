import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsAuth } from '../common/common';
import * as z from 'zod/mini';
import { propsValidation } from '@activepieces/pieces-common';
import { nextRows } from '../common/next-rows';
import { sheetsGetNextRowsActionOutputSchema } from '../output-schemas';

export const sheetsGetNextRows = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_get_next_rows',
	classification: 'READ',
	displayName: 'Get Next Rows (Paginated)',
	description: 'Get the next group of rows from a worksheet, advancing a stored cursor.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads the next batch of rows from a worksheet, advancing a cursor stored under a memory key so successive runs walk the sheet without reprocessing rows. Use to iterate a large sheet in chunks across flow runs; for a one-shot full read use sheets_get_all_rows. Not idempotent — each non-test call moves the stored cursor forward.',
		idempotent: false,
	},
	outputSchema: sheetsGetNextRowsActionOutputSchema,
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

		if (!areSheetIdsValid(spreadsheet_id, sheet_id) || isNil(spreadsheet_id) || isNil(sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		await propsValidation.validateZod(propsValue, {
			start_row: z.number().check(z.minimum(1)),
			group_size: z.number().check(z.minimum(1)),
		});

		return await nextRows.readNextRows({
			store,
			auth,
			spreadsheetId: spreadsheet_id,
			sheetId: sheet_id,
			memKey: mem_key,
			groupSize: group_size,
			startRow: start_row,
			headerRow: header_row,
			useHeaderNames: use_header_names === true,
			testing: false,
		});
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

		if (!areSheetIdsValid(spreadsheet_id, sheet_id) || isNil(spreadsheet_id) || isNil(sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		return await nextRows.readNextRows({
			store,
			auth,
			spreadsheetId: spreadsheet_id,
			sheetId: sheet_id,
			memKey: mem_key,
			groupSize: group_size,
			startRow: start_row,
			headerRow: header_row,
			useHeaderNames: use_header_names === true,
			testing: true,
		});
	},
});
