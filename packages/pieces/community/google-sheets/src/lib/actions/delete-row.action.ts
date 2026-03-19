import { createAction, Property } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';

export const deleteRowAction = createAction({
  auth: googleSheetsAuth,
  name: 'delete_row',
  description: 'Delete a specific row from the selected sheet.',
  displayName: 'Delete Row',
  props: {
    ...commonProps,
    rowId: Property.Number({
      displayName: 'Row Number',
      description: 'The number of the row you want to delete.',
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
      context.auth,
    );

    return {
      success: true,
      body: response,
    };
  },
});
