import {createAction} from '../../../framework/action/action';
import { InputType } from '../../../framework/config';

import {appendGoogleSheetValues, Dimension, ValueInputOption} from './utils';

export const insertRowAction = createAction({
	name: 'insert_row',
	description: 'Append values to an existing sheet you have access to',
    displayName:'Insert Row',
	configs: [
		{
			name: 'authentication',
			description: "",
			displayName: 'Authentication',
			type: InputType.OAUTH2,
			authUrl: "https://accounts.google.com/o/oauth2/auth",
			tokenUrl: "https://oauth2.googleapis.com/token",
			required: true,
			scopes: ["https://www.googleapis.com/auth/spreadsheets"]
		},
		{
			name: 'range',
			displayName: 'Range',
			description: 'The A1 notation of a range to search for a logical table of data. Values are appended after the last row of the table.\n https://developers.google.com/sheets/api/guides/concepts#cell',
			type: InputType.LONG_TEXT,
			required: true,
		},
		{
			name: 'values',
			displayName: 'Values',
			description: 'These are the cell values that will be appended to your sheet, they should be a json array',
            type: InputType.LONG_TEXT,
			required: true,
		},
		{
			name: 'spreadSheetId',
			displayName: 'Spread Sheet Id',
			description: 'The id of your spread sheet: https://docs.google.com/spreadsheets/d/{spreadSheetId}',
			type: InputType.SHORT_TEXT,
			required: true,
		},
		{
			name: 'asString',
			displayName: 'As String',
			description: 'Inserted values that are dates and formulas will be strings and have no affect',
			type: InputType.CHECKBOX,
			required: false,
		},
	],
	async runner(configValue) {
		const values = configValue['values'];
		if(typeof(values)=== "string")
		{
			try{
				const jsonValues= JSON.parse(values);
				await appendGoogleSheetValues({
					accessToken: configValue['authentication']['access_token'],
					majorDimension: Dimension.COLUMNS,
					range: configValue['range'],
					spreadSheetId: configValue['spreadSheetId'],
					valueInputOption: configValue['asString']
						? ValueInputOption.RAW
						: ValueInputOption.USER_ENTERED,
					values: jsonValues as string[],
				});
			}
			catch(error)
			{
				console.error(error);
				throw error;
			}
		}
		else if(Array.isArray(values))
		{			
				await appendGoogleSheetValues({
					accessToken: configValue['authentication']['access_token'],
					majorDimension: Dimension.COLUMNS,
					range: configValue['range'],
					spreadSheetId: configValue['spreadSheetId'],
					valueInputOption: configValue['asString']
						? ValueInputOption.RAW
						: ValueInputOption.USER_ENTERED,
					values: values as string[],
				});
		}
		else
		{
			throw Error("Values passed are not a string or an array")
		}
		return {
			success: true,
		};
	},
});