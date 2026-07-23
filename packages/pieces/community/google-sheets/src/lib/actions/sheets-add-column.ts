import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	columnToLabel,
	createGoogleClient,
	getHeaderRow,
	googleSheetsAuth,
	ValueInputOption,
} from '../common/common';
import { sheets as googleSheets } from '@googleapis/sheets';
import { getWorkSheetName } from '../triggers/helpers';

export const sheetsAddColumn = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_add_column',
	displayName: 'Add Column',
	description: 'Create a new column in a worksheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Inserts a new column into a worksheet and writes a header name into its first row, at a given 1-based column index or after the last column. Use to add a field. Not idempotent — each call inserts another column.',
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
		column_name: Property.ShortText({
			displayName: 'Column Name',
			description: 'The header name to write into the first row of the new column.',
			required: true,
		}),
		column_index: Property.Number({
			displayName: 'Column Index',
			description:
				'The 1-based column index where the column is inserted (e.g. 3 inserts at the third column). If less than 1 or omitted, the column is added after the last current column.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, column_name, column_index } = context.propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		let columnLabel;

		if (column_index && column_index > 0) {
			await sheets.spreadsheets.batchUpdate({
				spreadsheetId: spreadsheet_id,
				requestBody: {
					requests: [
						{
							insertDimension: {
								range: {
									sheetId: sheet_id,
									dimension: 'COLUMNS',
									startIndex: column_index - 1,
									endIndex: column_index,
								},
							},
						},
					],
				},
			});
			columnLabel = columnToLabel(column_index - 1);
		} else {
			const headers = await getHeaderRow({
				spreadsheetId: spreadsheet_id as string,
				sheetId: sheet_id as number,
				auth: context.auth,
			});

			const newColumnIndex = headers === undefined ? 0 : headers.length;

			await sheets.spreadsheets.batchUpdate({
				spreadsheetId: spreadsheet_id,
				requestBody: {
					requests: [
						{
							insertDimension: {
								range: {
									sheetId: sheet_id,
									dimension: 'COLUMNS',
									startIndex: newColumnIndex,
									endIndex: newColumnIndex + 1,
								},
							},
						},
					],
				},
			});
			columnLabel = columnToLabel(newColumnIndex);
		}

		const sheetName = await getWorkSheetName(
			context.auth,
			spreadsheet_id as string,
			sheet_id as number,
		);

		const response = await sheets.spreadsheets.values.update({
			range: `${sheetName}!${columnLabel}1`,
			spreadsheetId: spreadsheet_id,
			valueInputOption: ValueInputOption.USER_ENTERED,
			requestBody: {
				values: [[column_name]],
			},
		});

		return response.data;
	},
});
