import { createAction, Property, Validators } from '@activepieces/pieces-framework';
import { getGoogleSheetRows, googleSheetsCommon, labelToColumn } from '../common/common';
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
            required: false
        }),
        match_case: Property.Checkbox({
            displayName: 'Exact match',
            description: 'Whether to choose the rows with exact match or choose the rows that contain the search value',
            required: true,
            defaultValue: false
        }),
        starting_row: Property.Number({
            displayName: 'Starting Row',
            description: 'The row number to start searching from',
            required: false,
            validators: [ Validators.minValue(1) ],
        }),
        number_of_rows: Property.Number({
            displayName: 'Number of Rows',
            description: 'The number of rows to search ( the default is 1 if not specified )',
            required: false,
            defaultValue: 1,
            validators: [ Validators.minValue(1) ],
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

        let values = [];
        if( !propsValue.starting_row ){
            values = await googleSheetsCommon.getValues(
                propsValue.spreadsheet_id,
                auth['access_token'],
                propsValue.sheet_id
            );

            values = values.map((value) => {
                return value.values;
            });

        }else{
            const number_of_rows = propsValue.number_of_rows ?? 1;

            values = await getGoogleSheetRows({
                accessToken: auth['access_token'],
                sheetName: sheetName,
                spreadSheetId: propsValue['spreadsheet_id'],
                rowIndex_s: propsValue['starting_row'],
                rowIndex_e: propsValue['starting_row'] + number_of_rows - 1
            });
            
        }

        const matchingRows: any[] = [];
        const columnName = propsValue.column_name ? propsValue.column_name : 'A';
        const column_number = labelToColumn(columnName);
        const search_value = propsValue.search_value ?? '';

        for( const row of values ){

            if( search_value === '' ){
                matchingRows.push(row);
                continue;
            }

            const keys = Object.keys(row);
            if( keys.length <= column_number ) continue;
            const entry_value = row[ keys[column_number] ];

            if( entry_value === undefined ){
                continue;
            }
            if( propsValue.match_case ){
                if( entry_value === search_value ){
                    matchingRows.push(row);
                }
            }else{
                if( entry_value.toLowerCase().includes(search_value.toLowerCase()) ){
                    matchingRows.push(row);
                }
            }
        }


        return matchingRows;
    }
});
