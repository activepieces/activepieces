import { googleSheetsAuth } from '../../index';
import {
	createAction,
	DynamicPropsValue,
	OAuth2PropertyValue,
	Property,
} from '@activepieces/pieces-framework';
import { areSheetIdsValid, Dimension, googleSheetsCommon, objectToArray, ValueInputOption } from '../common/common';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { isNil, isString, MarkdownVariant } from '@activepieces/shared';
import { getWorkSheetName } from '../triggers/helpers';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { commonProps } from '../common/props';

export const updateMultipleRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'update-multiple-rows',
	displayName: 'Update Multiple Rows',
	description: 'Updates multiple rows in a specific spreadsheet.',
	props: {
		...commonProps,
		values: Property.DynamicProperties({
			displayName: 'Values',
			description: 'The values to update.',
			required: true,
			refreshers: ['sheetId', 'spreadsheetId'],
			props: async ({ auth, spreadsheetId, sheetId }) => {
				const sheet_Id = Number(sheetId);
				const spreadsheet_Id = spreadsheetId as unknown as string;
				const authentication = auth as OAuth2PropertyValue;

				if (
					!auth ||
					(spreadsheet_Id ?? '').toString().length === 0 ||
					(sheet_Id ?? '').toString().length === 0
				) {
					return {};
				}

				const fields: DynamicPropsValue = {};

				const headers = await googleSheetsCommon.getGoogleSheetRows({
					spreadsheetId: spreadsheet_Id,
					accessToken: getAccessTokenOrThrow(authentication),
					sheetId: sheet_Id,
					rowIndex_s: 1,
					rowIndex_e: 1,
				});
				const firstRow = headers[0].values ?? {};

				//check for empty headers
				if (Object.keys(firstRow).length === 0) {
					fields['markdown'] = Property.MarkDown({
						value: `We couldn't find any headers in the selected spreadsheet or worksheet. Please add headers to the sheet and refresh the page to reflect the columns.`,
						variant: MarkdownVariant.INFO,
					});
				} else {
					const columns: {
						[key: string]: any;
					} = {
						rowId: Property.Number({
							displayName: 'Row Id',
							description: 'The row id to update',
							required: true,
						}),
					};

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
				}

				return fields;
			},
		}),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect',
			required: false,
		}),
	},
	async run(context) {
		const {
			 spreadsheetId:inputSpreadsheetId,
			 sheetId:inputSheetId,
			values: { values: rowValuesInput },
			as_string: asString,
		} = context.propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const valueInputOption = asString ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED;

		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const values: sheets_v4.Schema$ValueRange[] = [];

		for (const row of rowValuesInput) {
			const { rowId, ...rowValues } = row;
			if (rowId === undefined || rowId === null) {
				continue;
			}

			const formattedValues = objectToArray(rowValues).map((value: string | null | undefined) => {
				if (value === '' || value === null || value === undefined) {
					return null;
				}
				if (isString(value)) {
					return value;
				}
				return JSON.stringify(value, null, 2);
			});

			if (formattedValues.length === 0) {
				continue;
			}

			values.push({
				range: `${sheetName}!A${rowId}:ZZZ${rowId}`,
				majorDimension: Dimension.ROWS,
				values: [formattedValues],
			});
		}

		const response = await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId: spreadsheetId,

			requestBody: {
				valueInputOption: valueInputOption,
				data: values,
			},
		});

		return response.data;
	},
});
