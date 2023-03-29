import { createAction, Property } from '@activepieces/framework';
import { googleSheetsCommon } from '../common/common';

export const deleteRowAction = createAction({
    name: 'delete_row',
    description: 'Delete a row on an existing sheet you have access to',
    displayName: 'Delete Row',
    props: {
        authentication: googleSheetsCommon.authentication,
        spreadsheet_id:googleSheetsCommon.spreadsheet_id,
        sheet_id: googleSheetsCommon.sheet_id,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'The row number you want to remove',
            required: true,
        })
    },
    async run(context) {
        const sheetName = await googleSheetsCommon.findSheetName(context.propsValue['authentication']!['access_token'],context.propsValue['spreadsheet_id']!,context.propsValue['sheet_id']!);
        if(!sheetName)
        {
            throw Error("Sheet not found in spreadsheet");
        }

        await googleSheetsCommon.deleteRow(context.propsValue.spreadsheet_id, context.propsValue.sheet_id, context.propsValue.row_id, context.propsValue['authentication']!['access_token'])

        return {
            success: true,
        };
    },
});
