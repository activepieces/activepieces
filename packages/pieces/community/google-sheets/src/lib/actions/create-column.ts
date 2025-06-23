import { googleSheetsAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	columnToLabel,
	getHeaderRow,
	ValueInputOption,
} from '../common/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { getWorkSheetName } from '../triggers/helpers';
import { commonProps } from '../common/props';

export const createColumnAction = createAction({
	auth: googleSheetsAuth,
	name: 'create-column',
	displayName: 'Create Spreadsheet Column',
	description: 'Adds a new column to a spreadsheet.',
	props: {
		...commonProps,
		columnName: Property.ShortText({
			displayName: 'Column Name',
			required: true,
		}),
		columnIndex: Property.Number({
			displayName: 'Column Index',
			description:
				'The column index starts from 1.For example, if you want to add a column to the third column, enter 3.Ff the input is less than 1 the column will be added after the last current column.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheetId, sheetId, columnName, columnIndex } = context.propsValue;

		if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

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
									startIndex: columnIndex -1,
									endIndex: columnIndex,
								},
							},
						},
					],
				},
			});
			columnLabel = columnToLabel(columnIndex-1);
		} else {
			const headers = await getHeaderRow({
				spreadsheetId:spreadsheetId as string,
				sheetId :sheetId as number,
				accessToken: context.auth.access_token,
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

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId as string	, sheetId as number);

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
