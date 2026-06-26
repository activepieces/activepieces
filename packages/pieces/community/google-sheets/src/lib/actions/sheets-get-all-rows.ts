import { Property, createAction } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	googleSheetsAuth,
	googleSheetsCommon,
	mapRowsToHeaderNames,
} from '../common/common';

export const sheetsGetAllRows = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_get_all_rows',
	displayName: 'Get All Rows',
	description: 'Read every row from a worksheet in a single call.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads every row from a worksheet in one call, optionally keying values by the header row. Use when an agent needs the full sheet contents rather than a search or a single row; be mindful of size on large sheets (prefer sheets_find_rows or sheets_get_next_rows for big sheets). Read-only.',
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
				'The numeric worksheet (tab) id (gid). Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		first_row_headers: Property.Checkbox({
			displayName: 'First Row Headers',
			description:
				'When true, the first row is treated as headers (excluded from the data and used to key each row\'s values by header name). When false, every row is returned and keyed by column letter (A, B, C, ...).',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, first_row_headers } = context.propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const rows = await googleSheetsCommon.getGoogleSheetRows({
			auth: context.auth,
			sheetId: sheet_id as number,
			spreadsheetId: spreadsheet_id as string,
			rowIndex_s: first_row_headers ? 2 : undefined,
			rowIndex_e: undefined,
			headerRow: 1,
		});

		const result = await mapRowsToHeaderNames(
			rows,
			first_row_headers ?? false,
			spreadsheet_id as string,
			sheet_id as number,
			1,
			context.auth,
		);

		return {
			rows: result,
			count: result.length,
		};
	},
});
