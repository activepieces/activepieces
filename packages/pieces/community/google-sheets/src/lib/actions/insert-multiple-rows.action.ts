import { googleSheetsAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import {
    Dimension,
    getHeaders,
    googleSheetsCommon,
    objectToArray,
    objectWithHeadersAsKeysToArray,
    ValueInputOption,
} from '../common/common';
import { getWorkSheetName } from '../triggers/helpers';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const insertMultipleRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'google-sheets-insert-multiple-rows',
	displayName: 'Insert Multiple Rows',
	description: 'Add one or more new rows in a specific spreadsheet.',
	props: {
		spreadsheet_id: googleSheetsCommon.spreadsheet_id,
		include_team_drives: googleSheetsCommon.include_team_drives,
		sheet_id: googleSheetsCommon.sheet_id,
		as_string: googleSheetsCommon.as_string,
		values: googleSheetsCommon.valuesForMultipleRows,
        headersAsKeys: googleSheetsCommon.headersAsKeysForInsert,
	},

	async run(context) {
		const spreadSheetId = context.propsValue.spreadsheet_id;
		const sheetId = context.propsValue.sheet_id;
		const rowValuesInput = context.propsValue.values['values'] as any[];

		const sheetName = await getWorkSheetName(context.auth, spreadSheetId, sheetId);

		const formattedValues = [];

		const headers = context.propsValue.headersAsKeys ? await getHeaders({
			accessToken: context.auth['access_token'],
			sheetName: sheetName,
			spreadSheetId: spreadSheetId,
		}) : [];

		for (const rowInput of rowValuesInput) {
			formattedValues.push(
				context.propsValue.headersAsKeys
				? await objectWithHeadersAsKeysToArray(headers, rowInput)
				: objectToArray(rowInput)
			);
		}

		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);

		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.values.append({
			range: sheetName + '!A:A',
			spreadsheetId: spreadSheetId,
			valueInputOption: context.propsValue.as_string
				? ValueInputOption.RAW
				: ValueInputOption.USER_ENTERED,
			requestBody: {
				values: formattedValues,
				majorDimension: Dimension.ROWS,
			},
		});
		return response.data;
	},
});
