import { googleSheetsAuth } from '../../';
import {
	createAction,
	DynamicPropsValue,
	OAuth2PropertyValue,
	Property,
} from '@activepieces/pieces-framework';
import { Dimension, googleSheetsCommon, objectToArray, ValueInputOption } from '../common/common';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
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
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect',
			required: false,
		}),
		values: Property.DynamicProperties({
			displayName: 'Values',
			description: 'The values to insert.',
			required: true,
			refreshers: ['sheet_id', 'spreadsheet_id'],
			props: async ({ auth, sheet_id, spreadsheet_id }) => {
				if (
					!auth ||
					(spreadsheet_id ?? '').toString().length === 0 ||
					(sheet_id ?? '').toString().length === 0
				) {
					return {};
				}

				const fields: DynamicPropsValue = {};

				const authentication = auth as OAuth2PropertyValue;
				const values = await googleSheetsCommon.getValues(
					spreadsheet_id as unknown as string,
					getAccessTokenOrThrow(authentication),
					sheet_id as unknown as number,
				);

				const firstRow = values?.[0]?.values ?? [];
				const columns: {
					[key: string]: any;
				} = {};
				for (const key in firstRow) {
					columns[key] = Property.ShortText({
						displayName: firstRow[key].toString(),
						description: firstRow[key].toString(),
						required: false,
						defaultValue: '',
					});
				}

				fields['values'] = Property.Array({
					displayName: 'Values',
					required: false,
					properties: columns,
				});

				return fields;
			},
		}),
	},

	async run(context) {
		const spreadSheetId = context.propsValue.spreadsheet_id;
		const sheetId = context.propsValue.sheet_id;
		const rowValuesInput = context.propsValue.values['values'] as any[];

		const sheetName = await getWorkSheetName(context.auth, spreadSheetId, sheetId);

		const formattedValues = [];

		for (const rowInput of rowValuesInput) {
			formattedValues.push(objectToArray(rowInput));
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
