import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import {
  getGoogleSheetRows,
  googleSheetsCommon,
  labelToColumn,
} from '../common/common';
import { googleSheetsAuth } from '../..';

export const findRowsAction = createAction({
  auth: googleSheetsAuth,
  name: 'find_rows',
  description:
    'Find or get rows in a Google Sheet by column name and search value',
  displayName: 'Find Rows',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
    sheet_id: googleSheetsCommon.sheet_id,
    columnName: googleSheetsCommon.columnName,
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
      validators: [Validators.minValue(1)],
    }),
    numberOfRows: Property.Number({
      displayName: 'Number of Rows',
      description:
        'The number of rows to search ( the default is 1 if not specified )',
      required: false,
      defaultValue: 1,
      validators: [Validators.minValue(1)],
    }),
  },
  async run({ propsValue, auth }) {
    const sheetName = await googleSheetsCommon.findSheetName(
      auth['access_token'],
      propsValue['spreadsheet_id'],
      propsValue['sheet_id']
    );

    let rows = [];
    let values = [];
    if (!propsValue.startingRow) {
      rows = await googleSheetsCommon.getValues(
        propsValue.spreadsheet_id,
        auth['access_token'],
        propsValue.sheet_id
      );

      values = rows.map((row) => {
        return row.values;
      });
    } else {
      const numberOfRows = propsValue.numberOfRows ?? 1;

      rows = await getGoogleSheetRows({
        accessToken: auth['access_token'],
        sheetName: sheetName,
        spreadSheetId: propsValue['spreadsheet_id'],
        rowIndex_s: propsValue['startingRow'],
        rowIndex_e: propsValue['startingRow'] + numberOfRows - 1,
      });

      values = rows.map((row) => {
        return row.values;
      });
    }

    const matchingRows: any[] = [];
    const columnName = propsValue.columnName ? propsValue.columnName : 'A';
    const columnNumber = labelToColumn(columnName);
    const searchValue = propsValue.searchValue ?? '';

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (searchValue === '') {
        matchingRows.push(rows[i]);
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
          matchingRows.push(rows[i]);
        }
      } else {
        if (entry_value.toLowerCase().includes(searchValue.toLowerCase())) {
          matchingRows.push(rows[i]);
        }
      }
    }

    return matchingRows;
  },
});
