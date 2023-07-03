import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
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
        column_name: Property.Dropdown<string>({
            description: 'Column Name',
            displayName: 'The name of the column to search in',
            required: true,
            refreshers: ['authentication', 'sheet_id', 'spreadsheet_id'],
            options: async (context) => {
                const authentication = context.authentication as OAuth2PropertyValue;
                const spreadsheet_id = context.spreadsheet_id as string;
                const sheet_id = context.sheet_id as number;
                const accessToken = authentication['access_token'] ?? '';

                const sheetName = await googleSheetsCommon.findSheetName(accessToken, spreadsheet_id, sheet_id);

                if (!sheetName) {
                    throw Error("Sheet not found in spreadsheet");
                }

                const values = await googleSheetsCommon.getValues(spreadsheet_id, accessToken, sheet_id);

                const ret = [];
                
                const firstRow = values[0].values;
                console.log(values);
                if (firstRow.length === 0) {
                    let ColumnSize = 1;

                    for (const row of values) {
                        ColumnSize = Math.max(ColumnSize, row.values.length);
                    }

                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

                    for (let i = 0; i < ColumnSize; i++) {
                        ret.push({
                            label: alphabet[i].toUpperCase(),
                            value: alphabet[i],
                        });
                    }
                }else {
                    for (const key in firstRow) {
                        for (const Letter in firstRow[key]) {
                            ret.push({
                                label: firstRow[key][Letter].toString(),
                                value: Letter,
                            });
                        }
                    }
                }
                
                return {
                    options: ret,
                    disabled: false,
                };
            }
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
