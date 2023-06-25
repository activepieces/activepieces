import { createAction, Property } from '@activepieces/pieces-framework';
import { Dimension, ValueInputOption } from '../common/common';
import { googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../../';

export const insertRowAction = createAction({
    auth: googleSheetsAuth,
    action: {
        name: 'insert_row',
        description: 'Append values to an existing sheet',
        displayName: 'Insert Row',
        props: {
            spreadsheet_id: googleSheetsCommon.spreadsheet_id,
            sheet_id: googleSheetsCommon.sheet_id,
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
            const sheetName = await googleSheetsCommon.findSheetName(context.auth.access_token,
            context.propsValue['spreadsheet_id'], context.propsValue['sheet_id']);
            if (!sheetName) {
                throw Error("Sheet not found in spreadsheet");
            }
            if (Array.isArray(values)) {
                await googleSheetsCommon.appendGoogleSheetValues({
                    accessToken: context.auth.access_token,
                    majorDimension: Dimension.COLUMNS,
                    range: sheetName,
                    spreadSheetId: context.propsValue['spreadsheet_id'],
                    valueInputOption: context.propsValue['as_string']
                        ? ValueInputOption.RAW
                        : ValueInputOption.USER_ENTERED,
                    values: values as string[],
                });
            } else {
                throw Error("Values passed are not an array")
            }
            return {
                success: true,
            };
        },
    }
});
