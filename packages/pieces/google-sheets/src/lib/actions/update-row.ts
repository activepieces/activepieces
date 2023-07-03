import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { ValueInputOption } from '../common/common';
import { googleSheetsCommon } from '../common/common';
export const updateRowAction = createAction({
    name: 'update_row',
    description: 'Overwrite values in an existing row',
    displayName: 'Update Row',
    props: {
        authentication: googleSheetsCommon.authentication,
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'The row number to update',
            required: true,
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
                if (firstRow.length === 0) {
                    let ColumnSize = 1;

                    for (const row of values) {
                        ColumnSize = Math.max(ColumnSize, row.values.length);
                    }

                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

                    for (let i = 0; i < ColumnSize; i++) {
                        properties[alphabet[i]] = Property.ShortText({
                            displayName: alphabet[i].toUpperCase(),
                            description: alphabet[i].toUpperCase(),
                            required: true
                        });
                    }
                }else {
                    for (const key in firstRow) {
                        for (const Letter in firstRow[key]) {
                            properties[Letter] = Property.ShortText({
                                displayName: firstRow[key][Letter].toString(),
                                description: firstRow[key][Letter].toString(),
                                required: true
                            })
                        }
                    }
                }
                
                return properties;
            }
        })
    },
    async run(context) {
        const values = context.propsValue['values'];

        const sheetName = await googleSheetsCommon.findSheetName(context.propsValue['authentication']['access_token'], context.propsValue['spreadsheet_id'], context.propsValue['sheet_id']);
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }

        const formattedValues = [];
        for (const key in values) {
            formattedValues.push(values[key]);

        }

        if (formattedValues.length > 0) {
            const res = await googleSheetsCommon.updateGoogleSheetRow({
                accessToken: context.propsValue['authentication']['access_token'],
                rowIndex:  Number(context.propsValue.row_id),
                sheetName: sheetName,
                spreadSheetId: context.propsValue['spreadsheet_id'],
                valueInputOption: ValueInputOption.USER_ENTERED,
                values: formattedValues as string[],
            });

            
            res.body.updatedRange = res.body.updatedRange.replace(sheetName + "!", "");
            res.body.updatedRange = res.body.updatedRange.split(":");
            const UpdatedRows = [];
            
            for (let i = 0; i < res.body.updatedRange.length; i++) 
                UpdatedRows.push({ [res.body.updatedRange[i].charAt(0)]: parseInt(res.body.updatedRange[i].slice(1)) });
            

            return UpdatedRows;
        } else {
            throw Error("Values passed are not an array")
        }
    },
});