import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';

export const deleteRowAction = createAction({
    name: 'delete_row',
    description: 'Delete a row on an existing sheet you have access to',
    displayName: 'Delete Row',
    props: {
        authentication: googleSheetsCommon.authentication,
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'The row number to remove',
            required: true,
        })
    },
    async run(context) {
        const sheetName = await googleSheetsCommon.findSheetName(context.propsValue['authentication']['access_token'],
            context.propsValue['spreadsheet_id'],
            context.propsValue['sheet_id']);
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }

        // Subtract 1 from the row_id to convert it to 0-indexed
        const adjustedRowIndex = context.propsValue.row_id - 1;

        const response = await googleSheetsCommon.deleteRow(context.propsValue.spreadsheet_id, context.propsValue.sheet_id, adjustedRowIndex,
            context.propsValue['authentication']['access_token'])

        return {
            deletedRow: context.propsValue.row_id,
        }
    },
});
