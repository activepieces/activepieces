import { createAction, Property, Validators } from '@activepieces/pieces-framework';
import { getGoogleSheetRows, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';

export const readAllRowsAction = createAction({
    auth: googleSheetsAuth,
    name: 'read_all_rows',
    description: 'Read all rows in a Google Sheet',
    displayName: 'Read All Rows',
    props: {
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        sheet_id: googleSheetsCommon.sheet_id,
        starting_row: Property.Number({
            displayName: 'Starting Row',
            description: 'The row number to start reading from',
            required: false,
            validators: [Validators.minValue(1)],
        }),
        number_of_rows: Property.Number({
            displayName: 'Number of Rows',
            description: 'The number of rows to read (default is all if not specified)',
            required: false,
            validators: [Validators.minValue(1)],
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

        const rowCount = await googleSheetsCommon.getNumberOfRows(auth['access_token'], propsValue['spreadsheet_id'], propsValue['sheet_id']);

        const number_of_rows = propsValue.number_of_rows ?? rowCount;  
        const starting_row = propsValue.starting_row ?? 1;

        if (!propsValue.starting_row && !propsValue.number_of_rows) {
            values = await googleSheetsCommon.getValues(
                propsValue.spreadsheet_id,
                auth['access_token'],
                propsValue.sheet_id
            );
            values = values.map((value) => {
                return value.values;
            });
        } else {
            values = await getGoogleSheetRows({
                accessToken: auth['access_token'],
                sheetName: sheetName,
                spreadSheetId: propsValue['spreadsheet_id'],
                rowIndex_s: starting_row,
                rowIndex_e: starting_row + number_of_rows - 1
            });
        }

        return values;
    }
});