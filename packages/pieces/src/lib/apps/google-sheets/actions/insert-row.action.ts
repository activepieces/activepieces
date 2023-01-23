import { createAction } from '../../../framework/action/action';

import { Dimension, ValueInputOption } from '../common/common';
import { Property } from "../../../framework/property";
import { googleSheetsCommon } from '../common/common';

export const insertRowAction = createAction({
    name: 'insert_row',
    description: 'Append values to an existing sheet you have access to',
    displayName: 'Insert Row',
    props: {
        authentication: googleSheetsCommon.authentication,
        range: Property.LongText({
            displayName: 'Sheet Name (range)',
            description: 'The A1 notation of a range to search for a logical table of data. Values are appended after the last row of the table.\n \n https://developers.google.com/sheets/api/guides/concepts#cell',
            required: true,
        }),
    
        spread_sheet_id: Property.ShortText({
            displayName: 'Spread Sheet Id',
            description: 'The id of your spread sheet: https://docs.google.com/spreadsheets/d/{spreadSheetId}',
            required: true,
        }),
        as_string: Property.Checkbox({
            displayName: 'As String',
            description: 'Inserted values that are dates and formulas will be strings and have no affect',
            required: false,
        }),
        values: Property.Array({
            displayName: 'Values',
            description: 'These are the cell values of the row that will be added',
            required: true,
        }),
    },
    async run(context) {
        const values = context.propsValue['values'];
        if (typeof (values) === "string") {
            try {
                const jsonValues = JSON.parse(values);
                await googleSheetsCommon.appendGoogleSheetValues({
                    accessToken: context.propsValue.authentication!.access_token,
                    majorDimension: Dimension.COLUMNS,
                    range: context.propsValue['range']!,
                    spreadSheetId: context.propsValue['spread_sheet_id']!,
                    valueInputOption: context.propsValue['as_string']
                        ? ValueInputOption.RAW
                        : ValueInputOption.USER_ENTERED,
                    values: jsonValues as string[],
                });
            } catch (error) {
                console.error(error);
                throw error;
            }
        } else if (Array.isArray(values)) {
            await googleSheetsCommon.appendGoogleSheetValues({
                accessToken: context.propsValue['authentication']!['access_token'],
                majorDimension: Dimension.COLUMNS,
                range: context.propsValue['range']!,
                spreadSheetId: context.propsValue['spread_sheet_id']!,
                valueInputOption: context.propsValue['as_string']
                    ? ValueInputOption.RAW
                    : ValueInputOption.USER_ENTERED,
                values: values as string[],
            });
        } else {
            throw Error("Values passed are not a string or an array")
        }
        return {
            success: true,
        };
    },
});