import { createAction, Property } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';

export const clearSheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'clear_sheet',
  description: 'Clears all rows on an existing sheet',
  displayName: 'Clear Sheet',
  props: {
    ...commonProps,
    is_first_row_headers: Property.Checkbox({
      displayName: 'Is First row Headers?',
      description: 'If the first row is headers',
      required: true,
      defaultValue: true,
    }),
    headerRow: Property.Number({
      displayName: 'Header Row',
      description: 'Which row contains the headers?',
      required: true,
      defaultValue: 1,
    }),
  },
  async run({ propsValue, auth }) {
    const { spreadsheetId, sheetId, is_first_row_headers:isFirstRowHeaders, headerRow } = propsValue;

    if (!areSheetIdsValid(spreadsheetId, sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}
    await googleSheetsCommon.findSheetName(
      auth,
      spreadsheetId as string,
      sheetId as number
    );

    const rowsToDelete: number[] = [];
    const values = await googleSheetsCommon.getGoogleSheetRows({
      spreadsheetId: spreadsheetId as string,
      auth: auth,
      sheetId: sheetId as number,
      rowIndex_s: 1,
      rowIndex_e: undefined,
      headerRow: headerRow,
    });
    for (const key in values) {
      if (key === '0' && isFirstRowHeaders) {
        continue;
      }
      rowsToDelete.push(parseInt(key) + 1);
    }

    const response = await googleSheetsCommon.clearSheet(
      spreadsheetId as string,
      sheetId as number,
      auth,
      isFirstRowHeaders ? 1 : 0,
      rowsToDelete.length
    );

    return response.body;
  },
});
