import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import {
	areSheetIdsValid,
	googleSheetsAuth,
	googleSheetsCommon,
	mapRowsToHeaderNames,
} from '../common/common';

export const sheetsGetRow = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_get_row',
	displayName: 'Get Row by Number',
	description: 'Retrieve a single row by its row number.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads a single row by its row number, optionally keyed by header names instead of column letters. Use when you already know the exact row number (e.g. from sheets_find_rows); to search by value use sheets_find_rows, and to read an arbitrary cell range use sheets_get_values. Returns {found:false} if the row is past the grid. Read-only.',
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
		row_number: Property.Number({
			displayName: 'Row Number',
			description: 'The row number you want to retrieve.',
			required: true,
		}),
		header_row: Property.Number({
			displayName: 'Header Row Number',
			description: 'The row number where your column headers are located (usually row 1).',
			required: true,
			defaultValue: 1,
		}),
		use_header_names: Property.Checkbox({
			displayName: 'Use Column Names',
			description: 'Use column names as keys instead of A, B, C.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, row_number, header_row, use_header_names } =
			context.propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		let rows: Awaited<ReturnType<typeof googleSheetsCommon.getGoogleSheetRows>>;
		try {
			rows = await googleSheetsCommon.getGoogleSheetRows({
				auth: context.auth,
				sheetId: sheet_id as number,
				spreadsheetId: spreadsheet_id as string,
				rowIndex_s: row_number,
				rowIndex_e: row_number,
				headerRow: header_row,
			});
		} catch (error) {
			if (isRowOutOfGridError(error)) {
				return {
					found: false,
					row: null,
				};
			}
			throw error;
		}

		if (rows.length === 0) {
			return {
				found: false,
				row: null,
			};
		}

		const finalRows = await mapRowsToHeaderNames(
			rows,
			use_header_names ?? false,
			spreadsheet_id as string,
			sheet_id as number,
			header_row,
			context.auth,
		);

		return {
			found: true,
			row: finalRows[0].row,
			values: finalRows[0].values,
		};
	},
});

function isRowOutOfGridError(error: unknown): boolean {
	const pattern = /exceeds grid limits/i;

	if (error instanceof HttpError) {
		const apiMessage = extractApiErrorMessage(error.response?.body);
		if (apiMessage !== undefined && pattern.test(apiMessage)) {
			return true;
		}
	}
	if (error instanceof Error) {
		return pattern.test(error.message);
	}
	return false;
}

function extractApiErrorMessage(body: unknown): string | undefined {
	if (typeof body === 'string') {
		return body;
	}
	if (!body || typeof body !== 'object' || !('error' in body)) {
		return undefined;
	}
	const inner = body.error;
	if (!inner || typeof inner !== 'object' || !('message' in inner)) {
		return undefined;
	}
	const message = inner.message;
	return typeof message === 'string' ? message : undefined;
}
