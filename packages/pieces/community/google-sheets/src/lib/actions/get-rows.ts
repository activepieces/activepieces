import {
  PiecePropValueSchema,
  Property,
  Store,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import { googleSheetsAuth } from '../..';
import {
  areSheetIdsValid,
  googleSheetsCommon,
} from '../common/common';
import { isNil } from '@activepieces/shared';
import { HttpError } from '@activepieces/pieces-common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { getWorkSheetGridSize } from '../triggers/helpers';
import { commonProps } from '../common/props';

async function getRows(
  store: Store,
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  spreadsheetId: string,
  sheetId: number,
  memKey: string,
  groupSize: number,
  startRow: number,
  testing: boolean
) {
  const sheetName = await googleSheetsCommon.findSheetName(
    auth.access_token,
    spreadsheetId,
    sheetId
  );

  const sheetGridRange = await getWorkSheetGridSize(auth,spreadsheetId,sheetId);
  const existingGridRowCount = sheetGridRange.rowCount ??0;
	// const existingGridColumnCount = sheetGridRange.columnCount??26;



  const memVal = await store.get(memKey, StoreScope.FLOW);

  let startingRow;
  if (isNil(memVal) || memVal === '') startingRow = startRow || 1;
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


  if(startingRow > existingGridRowCount-1){
    return [];
  }

  const endRow = Math.min(startingRow + groupSize,existingGridRowCount);

  if (testing == false) await store.put(memKey, endRow, StoreScope.FLOW);

  const row = await googleSheetsCommon.getGoogleSheetRows({
    accessToken: auth.access_token,
    sheetId: sheetId,
    spreadsheetId: spreadsheetId,
    rowIndex_s: startingRow,
    rowIndex_e: endRow - 1,
  });

  if (row.length == 0) {
    const allRows = await googleSheetsCommon.getGoogleSheetRows({
      spreadsheetId: spreadsheetId,
      accessToken: auth.access_token,
      sheetId: sheetId,
      rowIndex_s: undefined,
      rowIndex_e: undefined,
    });
    const lastRow = allRows.length + 1;
    if (testing == false) await store.put(memKey, lastRow, StoreScope.FLOW);
  }

  return row;
}

const notes = `
**Notes:**

- Memory key is used to remember where last row was processed and will be used in the following runs.
- Republishing the flow **keeps** the memory key value, If you want to start over **change** the memory key.
`
export const getRowsAction = createAction({
  auth: googleSheetsAuth,
  name: 'get_next_rows',
  description: 'Get next group of rows from a Google Sheet',
  displayName: 'Get next row(s)',
  props: {
    ...commonProps,
    startRow: Property.Number({
      displayName: 'Start Row',
      description: 'Which row to start from?',
      required: true,
      defaultValue: 1,
    }),
    markdown: Property.MarkDown({
      value: notes
    }),
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
    }),
  },
  async run({ store, auth, propsValue }) {
    const { startRow, groupSize, memKey ,spreadsheetId,sheetId} = propsValue;

    if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    await propsValidation.validateZod(propsValue, {
      startRow: z.number().min(1),
      groupSize: z.number().min(1),
    });

    try {
      return await getRows(
        store,
        auth,
        spreadsheetId as string,
        sheetId as number,
        memKey,
        groupSize,
        startRow,
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
    const { startRow, groupSize, memKey ,spreadsheetId,sheetId} = propsValue;

    if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    try {
      return await getRows(
        store,
        auth,
        spreadsheetId as string,
        sheetId as number,
        memKey,
        groupSize,
        startRow,
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
