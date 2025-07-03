import { Property, createAction } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';
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
  },
  async run(context) {
    const {spreadsheetId,sheetId,rowNumber} = context.propsValue;

    if (!areSheetIdsValid(spreadsheetId,sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    const row = await googleSheetsCommon.getGoogleSheetRows({
      accessToken: context.auth.access_token,
      sheetId: sheetId as number,
      spreadsheetId: spreadsheetId as string,
      rowIndex_s: rowNumber,
      rowIndex_e: rowNumber,
    });
    return row[0];
  },
});
