import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';

export const findRowsAction = createAction({
    name: 'find_rows',
    description: 'Find rows in a Google Sheet',
    displayName: 'Find Rows',
    props: {
        authentication: googleSheetsCommon.authentication,
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
    async run(context) {
        const sheetName = await googleSheetsCommon.findSheetName(context.propsValue['authentication']['access_token'],
            context.propsValue['spreadsheet_id'],
            context.propsValue['sheet_id']);
        if (!sheetName) {
            throw Error("Sheet not found in spreadsheet");
        }
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        
        const column = alphabet.indexOf(context.propsValue.column_name?.toLowerCase().toString()[0] ?? 'a');
        if (column === -1) {
            throw Error("Column not found in sheet");
        }else{
            const values = await googleSheetsCommon.getValues(context.propsValue.spreadsheet_id, context.propsValue['authentication']['access_token'], context.propsValue.sheet_id);
            
            const matchingRows = [];
            for (const { row, values: innerValues } of values) {
                for (const value of innerValues) {
                    for (const key in value) {
                        if(value[key].includes(context.propsValue.search_value) && key.toLowerCase() === alphabet[column]){
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
