import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';

export const findRowsAction = createAction({
    auth: googleSheetsAuth,
    name: 'find_rows',
    description: 'Find rows in a Google Sheet',
    displayName: 'Find Rows',
    props: {
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        column_name: googleSheetsCommon.column_name,
        search_value: Property.ShortText({
            displayName: 'Search Value',
            description: 'The value to search for',
            required: true,
        }),
    },
    async run({propsValue, auth}) {
        const sheetName = await googleSheetsCommon.findSheetName(auth['access_token'],
            propsValue['spreadsheet_id'],
            propsValue['sheet_id']);
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }
        
        const columnName = propsValue.column_name?.toLowerCase().toString() ?? 'a';

        const values = await googleSheetsCommon.getValues(propsValue.spreadsheet_id, auth['access_token'],propsValue.sheet_id);

        const matchingRows: any = {};
        for (const { row, values: innerValues } of values) {
            Object.entries(innerValues).forEach(([key, value]) => {
                const v = value.toString();
                if(v.includes(propsValue.search_value) && key.toLowerCase() === columnName){
                    // return the whole row
                    matchingRows[key] = innerValues;
                }
            });
            
        }

        return matchingRows;
    },

});
