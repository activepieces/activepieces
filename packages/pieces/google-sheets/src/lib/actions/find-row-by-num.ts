import { Property, createAction } from "@activepieces/pieces-framework";
import { googleSheetsCommon , getGoogleSheetRows, getErrorSheet } from "../common/common";
import { googleSheetsAuth } from "../..";


export const findRowByNumAction = createAction({
    auth: googleSheetsAuth,
    name: 'find_row_by_num',
    description: 'Get a row in a Google Sheet by row number',
    displayName: 'Get Row',
    props: {
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        row_number: Property.Number({
            displayName: 'Row Number',
            description: 'The row number to get from the sheet',
            required: true
        })
    },
    async run({ propsValue, auth }) {
        const sheetName = await googleSheetsCommon.findSheetName(
            auth['access_token'],
            propsValue['spreadsheet_id'],
            propsValue['sheet_id']
        );
        if (!sheetName) {
            throw Error( getErrorSheet(propsValue['sheet_id']) );
        }
        
        const row = await getGoogleSheetRows({
            accessToken: auth['access_token'],
            sheetName: sheetName,
            spreadSheetId: propsValue['spreadsheet_id'],
            rowIndex_s: propsValue['row_number'],
            rowIndex_e: propsValue['row_number']
        });
        return row[0];
    }
});
