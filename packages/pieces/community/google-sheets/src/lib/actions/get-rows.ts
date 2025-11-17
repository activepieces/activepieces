import {
  PiecePropValueSchema,
  Property,
  Store,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import { googleSheetsAuth } from '../common/common';
import {
  areSheetIdsValid,
  GoogleSheetsAuthValue,
  googleSheetsCommon,
  mapRowsToHeaderNames,
} from '../common/common';
import { isNil } from '@activepieces/shared';
import { HttpError } from '@activepieces/pieces-common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { getWorkSheetGridSize } from '../triggers/helpers';
import { commonProps } from '../common/props';

async function getRows(
  store: Store,
  auth: GoogleSheetsAuthValue,
  spreadsheetId: string,
  sheetId: number,
  memKey: string,
  groupSize: number,
  startRow: number,
  headerRow: number,
  useHeaderNames: boolean,
  testing: boolean
) {
  const sheetGridRange = await getWorkSheetGridSize(auth,spreadsheetId,sheetId);
  const existingGridRowCount = sheetGridRange.rowCount ??0;
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
    auth,
    sheetId: sheetId,
    spreadsheetId: spreadsheetId,
    rowIndex_s: startingRow,
    rowIndex_e: endRow - 1,
    headerRow: headerRow,
  });

  if (row.length == 0) {
    const allRows = await googleSheetsCommon.getGoogleSheetRows({
      spreadsheetId: spreadsheetId,
      auth,
      sheetId: sheetId,
      rowIndex_s: undefined,
      rowIndex_e: undefined,
      headerRow: headerRow,
    });
    const lastRow = allRows.length + 1;
    if (testing == false) await store.put(memKey, lastRow, StoreScope.FLOW);
  }

  const finalRows = await mapRowsToHeaderNames(
    row,
    useHeaderNames,
    spreadsheetId,
    sheetId,
    headerRow,
    auth,
  );
  
  return finalRows;
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
    headerRow: Property.Number({
      displayName: 'Header Row',
      description: 'Which row contains the headers?',
      required: true,
      defaultValue: 1,
    }),
    useHeaderNames: Property.Checkbox({
    displayName: 'Use header names for keys',
    description: 'Map A/B/C… to the actual column headers (row specified above).',
    required: false,
    defaultValue: false,
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
    const { startRow, groupSize, memKey, headerRow, spreadsheetId, sheetId, useHeaderNames} = propsValue;

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
        headerRow,
        useHeaderNames as boolean,
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
    const { startRow, groupSize, memKey, headerRow, spreadsheetId, sheetId, useHeaderNames} = propsValue;

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
        headerRow,
        useHeaderNames as boolean,
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
