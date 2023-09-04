import { Property, StoreScope, Validators, createAction } from "@activepieces/pieces-framework";
import { googleSheetsAuth } from "../..";
import { getErrorSheet, getGoogleSheetRows, googleSheetsCommon } from "../common/common";
import { isNil } from "@activepieces/shared";

export const getRowsAction = createAction({
    auth: googleSheetsAuth,
    name: 'get_next_rows',
    description: 'Get next group of rows from a Google Sheet',
    displayName: 'Get next row(s)',
    props: {
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        include_team_drives: googleSheetsCommon.include_team_drives,
        sheet_id: googleSheetsCommon.sheet_id,
        mem_key: Property.ShortText({
            displayName: 'Memory Key',
            description: 'The key used to store the current row number in memory',
            required: true,
            defaultValue: 'row_number',
        }),
        group_size: Property.Number({
            displayName: 'Group Size',
            description: 'The number of rows to get',
            required: true,
            defaultValue: 1,
            validators: [Validators.minValue(1)],
        }),
    },
    async run({ store, auth, propsValue }) {
        const sheetName = await googleSheetsCommon.findSheetName(
            auth['access_token'],
            propsValue['spreadsheet_id'],
            propsValue['sheet_id']
        );
        if (!sheetName) {
            throw Error(getErrorSheet(propsValue['sheet_id']));
        }
        
        const mem_val = await store.get(propsValue.mem_key, StoreScope.FLOW);
        let starting_row;
        if (isNil(mem_val) || mem_val === '') {
            starting_row = 1;
        } else {
            // try to parse the value as a number if you fail then throw an error
            starting_row = parseInt(mem_val as string);
            if (isNaN(starting_row)) {
                throw Error('The value stored in memory key : ' + propsValue.mem_key + ' is ' + mem_val + ' and it is not a number');
            }
        }

        if (starting_row < 1) throw Error('Starting row : ' + starting_row + ' is less than 1' + mem_val);
        const end_row = starting_row + propsValue.group_size;

        const row = await getGoogleSheetRows({
            accessToken: auth['access_token'],
            sheetName: sheetName,
            spreadSheetId: propsValue['spreadsheet_id'],
            rowIndex_s: starting_row,
            rowIndex_e: end_row - 1
        });

        await store.put(propsValue.mem_key, end_row, StoreScope.FLOW);
        return row;
    }
});