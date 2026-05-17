import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { areSheetIdsValid, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';

export const findRowByNumAction = createAction({
	auth: googleSheetsAuth,
	name: 'find_row_by_num',
	displayName: 'Get Single Row by ID',
	description: 'Retrieve a specific row using its unique ID.',
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
	},
	async run(context) {
		const { spreadsheetId, sheetId, rowNumber, headerRow } = context.propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		let row: Awaited<ReturnType<typeof googleSheetsCommon.getGoogleSheetRows>>;
		try {
			row = await googleSheetsCommon.getGoogleSheetRows({
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

		if (row.length === 0) {
			return {
				found: false,
				row: null,
			};
		}

		return {
			found: true,
			row: row[0].row,
			values: row[0].values,
		};
	},
});

function isRowOutOfGridError(error: unknown): boolean {
	if (error instanceof HttpError) {
		const status = error.response?.status;
		if (status === 400) {
			const body = error.response?.body as { error?: { message?: string } } | undefined;
			const message = body?.error?.message ?? '';
			return /exceeds grid limits/i.test(message);
		}
	}
	if (error instanceof Error) {
		return /exceeds grid limits/i.test(error.message);
	}
	return false;
}
