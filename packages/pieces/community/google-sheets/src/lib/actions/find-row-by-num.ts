import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { areSheetIdsValid, googleSheetsCommon, mapRowsToHeaderNames } from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';

export const findRowByNumAction = createAction({
	auth: googleSheetsAuth,
	name: 'find_row_by_num',
	displayName: 'Get Single Row by ID',
	description: 'Retrieve a specific row using its unique ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Reads a single row from a worksheet by its row number, optionally keyed by header names instead of column letters. Use when an agent already knows the exact row to fetch. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		...commonProps,
		rowNumber: Property.Number({
			displayName: 'Row Number',
			description: 'Enter the row number you want to retrieve',
			required: true,
		}),
		headerRow: Property.Number({
			displayName: 'Header Row Number',
			description: 'Enter the row number where your column headers are located (usually row 1).',
			required: true,
			defaultValue: 1,
		}),
		useHeaderNames: Property.Checkbox({
			displayName: 'Use Column Names',
			description: 'Use column names as keys instead of A, B, C.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { spreadsheetId, sheetId, rowNumber, headerRow, useHeaderNames } = context.propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		let rows: Awaited<ReturnType<typeof googleSheetsCommon.getGoogleSheetRows>>;
		try {
			rows = await googleSheetsCommon.getGoogleSheetRows({
				auth: context.auth,
				sheetId: sheetId as number,
				spreadsheetId: spreadsheetId as string,
				rowIndex_s: rowNumber,
				rowIndex_e: rowNumber,
				headerRow: headerRow,
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
			useHeaderNames ?? false,
			spreadsheetId as string,
			sheetId as number,
			headerRow,
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
