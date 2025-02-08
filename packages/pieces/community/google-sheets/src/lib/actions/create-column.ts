import { googleSheetsAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	columnToLabel,
	getHeaderRow,
	googleSheetsCommon,
	ValueInputOption,
} from '../common/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { getWorkSheetName } from '../triggers/helpers';

export const createColumnAction = createAction({
	auth: googleSheetsAuth,
	name: 'create-column',
	displayName: 'Create Spreadsheet Column',
	description: 'Adds a new column to a spreadsheet.',
	props: {
		spreadsheet_id: googleSheetsCommon.spreadsheet_id,
		include_team_drives: googleSheetsCommon.include_team_drives,
		sheet_id: googleSheetsCommon.sheet_id,
		columnName: Property.ShortText({
			displayName: 'Column Name',
			required: true,
		}),
		columnIndex: Property.Number({
			displayName: 'Column Index',
			description:
				'The column index starts from 0.For example, if you want to add a column to the third column, enter 2.',
			required: false,
		}),
	},
	async run(context) {
		const {
			spreadsheet_id: spreadsheetId,
			sheet_id: sheetId,
			columnName,
			columnIndex,
		} = context.propsValue;

		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		let columnLabel;

		if (columnIndex) {
			await sheets.spreadsheets.batchUpdate({
				spreadsheetId,
				requestBody: {
					requests: [
						{
							insertDimension: {
								range: {
									sheetId,
									dimension: 'COLUMNS',
									startIndex: columnIndex,
									endIndex: columnIndex + 1,
								},
							},
						},
					],
				},
			});
			columnLabel = columnToLabel(columnIndex);
		} else {
			const headers = await getHeaderRow({
				spreadsheetId,
				sheetId,
				accessToken: context.auth.access_token,
			});

			if (!headers) {
				throw Error('No headers found in the sheet');
			}

			await sheets.spreadsheets.batchUpdate({
				spreadsheetId,
				requestBody: {
					requests: [
						{
							insertDimension: {
								range: {
									sheetId,
									dimension: 'COLUMNS',
									startIndex: headers.length,
									endIndex: headers.length + 1,
								},
							},
						},
					],
				},
			});
			columnLabel = columnToLabel(headers.length);
		}

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);

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
