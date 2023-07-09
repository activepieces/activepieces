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
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        
        const column = alphabet.indexOf(propsValue.column_name?.toLowerCase().toString()[0] ?? 'a');
        if (column === -1) {
            throw Error("Column not found in sheet");
        } else {
            const values = await googleSheetsCommon.getValues(propsValue.spreadsheet_id, auth['access_token'],propsValue.sheet_id);

            const matchingRows = [];
            for (const { row, values: innerValues } of values) {
                for (const value of innerValues) {
                    for (const key in value) {
                        if(value[key].includes(propsValue.search_value) && key.toLowerCase() === alphabet[column]){
                            matchingRows.push({
                                [key]: value[key],
                            });
                        }
                    }
                }
            }

            return matchingRows;
        }
    },

});
