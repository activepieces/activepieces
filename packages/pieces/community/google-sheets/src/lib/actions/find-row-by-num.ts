import { Property, createAction } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';

export const findRowByNumAction = createAction({
  auth: googleSheetsAuth,
  name: 'find_row_by_num',
  description: 'Get a row in a Google Sheet by row number',
  displayName: 'Get Row',
  props: {
    ...commonProps,
    rowNumber: Property.Number({
      displayName: 'Row Number',
      description: 'The row number to get from the sheet',
      required: true,
    }),
    headerRow: Property.Number({
      displayName: 'Header Row',
      description: 'Which row contains the headers?',
      required: true,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const {spreadsheetId,sheetId,rowNumber,headerRow} = context.propsValue;

    if (!areSheetIdsValid(spreadsheetId,sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    const row = await googleSheetsCommon.getGoogleSheetRows({
      auth: context.auth,
      sheetId: sheetId as number,
      spreadsheetId: spreadsheetId as string,
      rowIndex_s: rowNumber,
      rowIndex_e: rowNumber,
      headerRow: headerRow,
    });
    return row[0];
  },
});
