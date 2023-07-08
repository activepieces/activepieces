import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';
<<<<<<< HEAD
import { googleSheetsAuth } from '@activepieces/piece-google-sheets';

export const clearSheetAction = createAction({
    auth: googleSheetsAuth,
=======

export const clearSheetAction = createAction({
>>>>>>> main
    name: 'clear_sheet',
    description: 'Clears all rows on an existing sheet',
    displayName: 'Clear Sheet',
    props: {
<<<<<<< HEAD
=======
        authentication: googleSheetsCommon.authentication,
>>>>>>> main
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        is_first_row_headers: Property.Checkbox({
            displayName: 'Is First row Headers?',
            description: 'If the first row is headers',
            required: true,
            defaultValue: true,
        }),
    },
<<<<<<< HEAD
    async run({propsValue, auth}) {
        const sheetName = await googleSheetsCommon.findSheetName(auth['access_token'],
            propsValue['spreadsheet_id'],
            propsValue['sheet_id']);
=======
    async run(context) {
        const sheetName = await googleSheetsCommon.findSheetName(context.propsValue['authentication']['access_token'],
            context.propsValue['spreadsheet_id'],
            context.propsValue['sheet_id']);
>>>>>>> main
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }

        const rowsToDelete: number[] = [];
<<<<<<< HEAD
        const values = await googleSheetsCommon.getValues(propsValue.spreadsheet_id, auth['access_token'], propsValue.sheet_id);
        for (const key in values) {
            if (key === '0' && propsValue.is_first_row_headers) {
=======
        const values = await googleSheetsCommon.getValues(context.propsValue.spreadsheet_id, context.propsValue['authentication']['access_token'], context.propsValue.sheet_id);
        for (const key in values) {
            if (key === '0' && context.propsValue.is_first_row_headers) {
>>>>>>> main
                continue;
            }
            rowsToDelete.push(parseInt(key) + 1);
        }

        for (let i = 0; i < rowsToDelete.length; i++) {
<<<<<<< HEAD
            await googleSheetsCommon.clearSheet(propsValue.spreadsheet_id,
                propsValue.sheet_id, auth['access_token'],
                propsValue.is_first_row_headers ? 1 : 0, rowsToDelete.length)
=======
            await googleSheetsCommon.clearSheet(context.propsValue.spreadsheet_id,
                context.propsValue.sheet_id, context.propsValue['authentication']['access_token'],
                context.propsValue.is_first_row_headers ? 1 : 0, rowsToDelete.length)
>>>>>>> main
        }

        return {
            deletedRow: rowsToDelete,
        }
    },
});
