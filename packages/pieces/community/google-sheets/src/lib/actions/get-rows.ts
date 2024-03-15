import {
  Property,
  Store,
  StoreScope,
  Validators,
  createAction,
} from '@activepieces/pieces-framework';
import { googleSheetsAuth } from '../..';
import {
  getAllGoogleSheetRows,
  getGoogleSheetRows,
  googleSheetsCommon,
} from '../common/common';
import { isNil } from '@activepieces/shared';
import { HttpError } from '@activepieces/pieces-common';

async function getRows(
  store: Store,
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  memKey: string,
  groupSize: number,
  testing: boolean
) {
  const sheetName = await googleSheetsCommon.findSheetName(
    accessToken,
    spreadsheetId,
    sheetId
  );

  const memVal = await store.get(memKey, StoreScope.FLOW);

  let startingRow;
  if (isNil(memVal) || memVal === '') startingRow = 1;
  else {
    startingRow = parseInt(memVal as string);
    if (isNaN(startingRow)) {
      throw Error(
        'The value stored in memory key : ' +
          memKey +
          ' is ' +
          memVal +
          ' and it is not a number'
      );
    }
  }

  if (startingRow < 1)
    throw Error('Starting row : ' + startingRow + ' is less than 1' + memVal);
  const endRow = startingRow + groupSize;
  if (testing == false) await store.put(memKey, endRow, StoreScope.FLOW);

  const row = await getGoogleSheetRows({
    accessToken: accessToken,
    sheetName: sheetName,
    spreadSheetId: spreadsheetId,
    rowIndex_s: startingRow,
    rowIndex_e: endRow - 1,
  });

  if (row.length == 0) {
    const allRows = await getAllGoogleSheetRows({
      accessToken: accessToken,
      sheetName: sheetName,
      spreadSheetId: spreadsheetId,
    });
    const lastRow = allRows.length + 1;
    if (testing == false) await store.put(memKey, lastRow, StoreScope.FLOW);
  }

  return row;
}

export const getRowsAction = createAction({
  auth: googleSheetsAuth,
  name: 'get_next_rows',
  description: 'Get next group of rows from a Google Sheet',
  displayName: 'Get next row(s)',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
    sheet_id: googleSheetsCommon.sheet_id,
    memKey: Property.ShortText({
      displayName: 'Memory Key',
      description: 'The key used to store the current row number in memory',
      required: true,
      defaultValue: 'row_number',
    }),
    groupSize: Property.Number({
      displayName: 'Group Size',
      description: 'The number of rows to get',
      required: true,
      defaultValue: 1,
      validators: [Validators.minValue(1)],
    }),
  },
  async run({ store, auth, propsValue }) {
    try {
      return await getRows(
        store,
        auth['access_token'],
        propsValue['spreadsheet_id'],
        propsValue['sheet_id'],
        propsValue['memKey'],
        propsValue['groupSize'],
        false
      );
    } catch (error) {
      if (error instanceof HttpError) {
        const errorBody = error.response.body as any;
        throw new Error(errorBody['error']['message']);
      }
      throw error;
    }
  },
  async test({ store, auth, propsValue }) {
    try {
      return await getRows(
        store,
        auth['access_token'],
        propsValue['spreadsheet_id'],
        propsValue['sheet_id'],
        propsValue['memKey'],
        propsValue['groupSize'],
        true
      );
    } catch (error) {
      if (error instanceof HttpError) {
        const errorBody = error.response.body as any;
        throw new Error(errorBody['error']['message']);
      }
      throw error;
    }
  },
});
