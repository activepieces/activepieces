import { createAction, Property } from '@activepieces/pieces-framework';
import { ValueInputOption } from '../common/common';
import { googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';

export const updateRowAction = createAction({
    auth: googleSheetsAuth,
    name: 'update_row',
    description: 'Overwrite values in an existing row',
    displayName: 'Update Row',
    props: {
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'The row number to update',
            required: true,
        }),
        values: googleSheetsCommon.values,
    },
<<<<<<< HEAD
    async run({propsValue, auth}) {
        const sheetName = await googleSheetsCommon.findSheetName(auth['access_token'], propsValue['spreadsheet_id'], propsValue['sheet_id']);
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }
        const formattedValues = Object.values(propsValue['values']);
=======
    async run(context) {
        const sheetName = await googleSheetsCommon.findSheetName(context.propsValue['authentication']['access_token'], context.propsValue['spreadsheet_id'], context.propsValue['sheet_id']);
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }
        const formattedValues = Object.values(context.propsValue['values']);
>>>>>>> main
        if (formattedValues.length > 0) {
            const res = await googleSheetsCommon.updateGoogleSheetRow({
                accessToken: auth['access_token'],
                rowIndex:  Number(propsValue.row_id),
                sheetName: sheetName,
                spreadSheetId: propsValue['spreadsheet_id'],
                valueInputOption: ValueInputOption.USER_ENTERED,
<<<<<<< HEAD
                values: formattedValues as string[],
=======
                values: formattedValues,
>>>>>>> main
            });

            
            res.body.updatedRange = res.body.updatedRange.replace(sheetName + "!", "");
            res.body.updatedRange = res.body.updatedRange.split(":");
            const updatedRows = [];
            
            for (let i = 0; i < res.body.updatedRange.length; i++) 
                updatedRows.push({ [res.body.updatedRange[i].charAt(0)]: parseInt(res.body.updatedRange[i].slice(1)) });
            

            return updatedRows;
        } else {
            throw Error("Values passed are not an array")
        }
    },
});
