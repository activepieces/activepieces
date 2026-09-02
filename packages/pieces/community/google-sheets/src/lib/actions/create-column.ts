import { googleSheetsAuth } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	columnToLabel,
	createGoogleClient,
	getHeaderRow,
	ValueInputOption,
} from '../common/common';
import { sheets as googleSheets } from '@googleapis/sheets';
import { getWorkSheetName } from '../triggers/helpers';
import { commonProps } from '../common/props';
import { createColumnActionOutputSchema } from '../output-schemas';

export const createColumnAction = createAction({
	auth: googleSheetsAuth,
	name: 'create-column',
	classification: 'WRITE',
	displayName: 'Create Column',
	description: 'Add a new column to a worksheet.',
	audience: 'human',
	aiMetadata: {
		description:
			'Inserts a new column into a worksheet and writes a header name into its first row, either at a given column index or after the last existing column. Use when an agent needs to add a field to a sheet. Not idempotent — each call inserts another column.',
		idempotent: false,
	},
	props: {
		...commonProps,
		columnName: Property.ShortText({
			displayName: 'Column Name',
			description: 'The header text for the new column.',
			required: true,
		}),
		columnIndex: Property.Number({
			displayName: 'Column Index',
			description:
				'Where to place the column, counting from 1. Enter 3 to make it the third column. Leave empty, or enter less than 1, to add it after the last column.',
			required: false,
		}),
	},
	outputSchema: createColumnActionOutputSchema,
	async run(context) {
		const { spreadsheetId, sheetId, columnName, columnIndex } = context.propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		let columnLabel;

		if (columnIndex && columnIndex > 0) {
			await sheets.spreadsheets.batchUpdate({
				spreadsheetId,
				requestBody: {
					requests: [
						{
							insertDimension: {
								range: {
									sheetId,
									dimension: 'COLUMNS',
									startIndex: columnIndex - 1,
									endIndex: columnIndex,
								},
							},
						},
					],
				},
			});
			columnLabel = columnToLabel(columnIndex - 1);
		} else {
			const headers = await getHeaderRow({
				spreadsheetId: spreadsheetId as string,
				sheetId: sheetId as number,
				auth: context.auth,
			});

			const newColumnIndex = headers === undefined ? 0 : headers.length;

			await sheets.spreadsheets.batchUpdate({
				spreadsheetId,
				requestBody: {
					requests: [
						{
							insertDimension: {
								range: {
									sheetId,
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
			spreadsheetId as string,
			sheetId as number,
		);

		const response = await sheets.spreadsheets.values.update({
			range: `${sheetName}!${columnLabel}1`,
			spreadsheetId,
			valueInputOption: ValueInputOption.USER_ENTERED,
			requestBody: {
				values: [[columnName]],
			},
		});

		return response.data;
	},
});
