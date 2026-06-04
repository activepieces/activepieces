import { Property, createAction } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsCommon, mapRowsToHeaderNames } from '../common/common';
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
		useHeaderNames: Property.Checkbox({
			displayName: 'Use Column Names',
			description: 'Use column names as keys instead of A, B, C.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { spreadsheetId, sheetId, rowNumber, headerRow,useHeaderNames } = context.propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const rows = await googleSheetsCommon.getGoogleSheetRows({
			auth: context.auth,
			sheetId: sheetId as number,
			spreadsheetId: spreadsheetId as string,
			rowIndex_s: rowNumber,
			rowIndex_e: rowNumber,
			headerRow: headerRow,
		});
		
		const finalRows = await mapRowsToHeaderNames(
					rows,
					useHeaderNames ?? false,
					spreadsheetId as string,
					sheetId as number,
					headerRow,
					context.auth,
				); 

		return finalRows[0];
	},
});
