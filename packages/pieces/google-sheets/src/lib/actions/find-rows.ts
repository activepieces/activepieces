import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';

export const findRowsAction = createAction({
    name: 'find_rows',
    description: 'Find rows in a Google Sheet',
    displayName: 'Find Rows',
    props: {
        authentication: googleSheetsCommon.authentication,
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        sheet_id: googleSheetsCommon.sheet_id,
        column_name: Property.ShortText({
            displayName: 'Column Name',
            description: 'The name of the column to search in, e.g. "A"',
            required: true,
        }),
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
        // find the column index
        const column = alphabet.indexOf(context.propsValue.column_name.toLowerCase());
        if (column === -1) {
            throw Error("Column not found in sheet");
        }else{
            const values = await googleSheetsCommon.getValues(context.propsValue.spreadsheet_id, context.propsValue['authentication']['access_token'], context.propsValue.sheet_id);
            
            const matchingRows = [];
            for (let i = 0; i < values.length; i++) {
                if (values[i].length > column) {
                    const row = values[i][column];
                    if (row.includes(context.propsValue.search_value)) {
                        // Output would include the values in that row as a hash, identified by the header, 
                        // so the returned value would be something like:
                        // { row: 1, values: { "A": "Hello", "B": "World" } }
                        matchingRows.push({
                            row: i + 1,
                            values: values[i].map((value, index) => {
                                return {
                                    [alphabet[index].toUpperCase()]: value
                                }
                            })
                        });
                    }
                }
            }

            return matchingRows;
        }
    },
});
