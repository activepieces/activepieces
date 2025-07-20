import { createAction, Property } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../../';
import { commonProps } from '../common/props';

export const deleteRowAction = createAction({
  auth: googleSheetsAuth,
  name: 'delete_row',
  description: 'Delete a row on an existing sheet you have access to',
  displayName: 'Delete Row',
  props: {
    ...commonProps,
    rowId: Property.Number({
      displayName: 'Row Number',
      description: 'The row number to remove',
      required: true,
    }),
  },
  async run(context) {
    const { spreadsheetId, sheetId, rowId } = context.propsValue;

    if (!areSheetIdsValid(spreadsheetId,sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    // Subtract 1 from the row_id to convert it to 0-indexed
    const adjustedRowIndex = rowId - 1;
    const response = await googleSheetsCommon.deleteRow(
      spreadsheetId as string,
      sheetId as number,
      adjustedRowIndex,
      context.auth.access_token
    );

    return {
      success: true,
      body: response,
    };
  },
});
