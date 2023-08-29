import { Property, createAction } from "@activepieces/pieces-framework";
import { googleSheetsCommon , getGoogleSheetRow } from "../common/common";
import { googleSheetsAuth } from "../..";


export const findRowByNumAction = createAction({
    auth: googleSheetsAuth,
    name: 'find_row_by_num',
    description: 'Find a row in a Google Sheet by row number',
    displayName: 'Find Row By Number',
    props: {
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        row_number: Property.Number({
            displayName: 'Row Number',
            description: 'The row number to find',
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
            throw Error('Sheet not found in spreadsheet');
        }
        
        const row = await getGoogleSheetRow({
            accessToken: auth['access_token'],
            sheetName: sheetName,
            spreadSheetId: propsValue['spreadsheet_id'],
            rowIndex: propsValue['row_number']
        });
        return row;
    }
});
