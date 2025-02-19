import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  areSheetIdsValid,
  googleSheetsCommon,
  labelToColumn,
} from '../common/common';
import { googleSheetsAuth } from '../..';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { columnNameProp, commonProps } from '../common/props';

export const findRowsAction = createAction({
  auth: googleSheetsAuth,
  name: 'find_rows',
  description:
    'Find or get rows in a Google Sheet by column name and search value',
  displayName: 'Find Rows',
  props: {
    ...commonProps,
    columnName: columnNameProp(),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description:
        'The value to search for in the specified column. If left empty, all rows will be returned.',
      required: false,
    }),
    matchCase: Property.Checkbox({
      displayName: 'Exact match',
      description:
        'Whether to choose the rows with exact match or choose the rows that contain the search value',
      required: true,
      defaultValue: false,
    }),
    startingRow: Property.Number({
      displayName: 'Starting Row',
      description: 'The row number to start searching from',
      required: false,
    }),
    numberOfRows: Property.Number({
      displayName: 'Number of Rows',
      description:
        'The number of rows to return ( the default is 1 if not specified )',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ propsValue, auth }) {
    await propsValidation.validateZod(propsValue, {
      startingRow: z.number().min(1).optional(),
      numberOfRows: z.number().min(1).optional(),
    });

    const spreadsheetId = propsValue.spreadsheetId;
    const sheetId = propsValue.sheetId;
    const startingRow = propsValue.startingRow ?? 1;
    const numberOfRowsToReturn = propsValue.numberOfRows ?? 1;

    if (!areSheetIdsValid(spreadsheetId,sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    const rows = await googleSheetsCommon.getGoogleSheetRows({
      spreadsheetId: spreadsheetId as string,
      accessToken: auth.access_token,
      sheetId: sheetId as number,
      rowIndex_s: startingRow,
      rowIndex_e: undefined,
    });

    const values = rows.map((row) => {
      return row.values;
    });

    const matchingRows: any[] = [];
    const columnName = propsValue.columnName ? propsValue.columnName : 'A';
    const columnNumber:number = labelToColumn(columnName);
    const searchValue = propsValue.searchValue ?? '';

    let matchedRowCount = 0;

    for (let i = 0; i < values.length; i++) {
      const row:Record<string,any> = values[i];

      if (matchedRowCount === numberOfRowsToReturn) break;

      if (searchValue === '') {
        matchingRows.push(rows[i]);
        matchedRowCount += 1;
        continue;
      }

      const keys = Object.keys(row);
      if (keys.length <= columnNumber) continue;
      const entry_value = row[keys[columnNumber]];

      if (entry_value === undefined) {
        continue;
      }
      if (propsValue.matchCase) {
        if (entry_value === searchValue) {
          matchedRowCount += 1;
          matchingRows.push(rows[i]);
        }
      } else {
        if (entry_value.toLowerCase().includes(searchValue.toLowerCase())) {
          matchedRowCount += 1;
          matchingRows.push(rows[i]);
        }
      }
    }

    return matchingRows;
  },
});
