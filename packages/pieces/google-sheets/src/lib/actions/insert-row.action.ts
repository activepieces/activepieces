import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { Dimension, googleSheetsCommon, ValueInputOption } from '../common/common';

export const insertRowAction = createAction({
    name: 'insert_row',
    description: 'Append a row of values to an existing sheet',
    displayName: 'Insert Row',
    props: {
        authentication: googleSheetsCommon.authentication,
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        as_string: Property.Checkbox({
            displayName: 'As String',
            description: 'Inserted values that are dates and formulas will be entered strings and have no effect',
            required: false,
        }),
        values: Property.DynamicProperties({
            displayName: 'Values',
            description: 'The values to insert',
            required: true,
            refreshers: ['authentication', 'sheet_id', 'spreadsheet_id'],
            props: async (context) => {
                
                const authentication = context.authentication as OAuth2PropertyValue;
                const spreadsheet_id = context.spreadsheet_id as unknown as string;
                const sheet_id = context.sheet_id as unknown as number;
                const accessToken = authentication['access_token'] ?? '';

                const sheetName = await googleSheetsCommon.findSheetName(accessToken, spreadsheet_id, sheet_id);

                if (!sheetName) {
                    throw Error("Sheet not found in spreadsheet");
                }

                const values = await googleSheetsCommon.getValues(spreadsheet_id, accessToken, sheet_id);

                
                const firstRow = values[0].values;
                const properties: {
                    [key: string]: any
                } = { }
                for (const key in firstRow) {
                    for (const Letter in firstRow[key]) {
                        properties[Letter] = Property.ShortText({
                            displayName: firstRow[key][Letter].toString(),
                            description: firstRow[key][Letter].toString(),
                            required: true
                        })
                    }
                }
                
                return properties;
            }
        })
        
    },
    async run(context) {
        const values = context.propsValue['values'];
        const sheetName = await googleSheetsCommon.findSheetName(context.propsValue['authentication']['access_token'], 
        context.propsValue['spreadsheet_id'], context.propsValue['sheet_id']);
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }

        const formattedValues = [];
        for (const key in values) {
            formattedValues.push(values[key]);

        }
        
        if (formattedValues.length > 0) {
            const res = await googleSheetsCommon.appendGoogleSheetValues({
                accessToken: context.propsValue['authentication']['access_token'],
                majorDimension: Dimension.COLUMNS,
                range: sheetName,
                spreadSheetId: context.propsValue['spreadsheet_id'],
                valueInputOption: context.propsValue['as_string']
                    ? ValueInputOption.RAW
                    : ValueInputOption.USER_ENTERED,
                values: formattedValues as string[],
            });

            return res.body;
        } else {
            throw Error("Values passed are not an array")
        }
    },
});
