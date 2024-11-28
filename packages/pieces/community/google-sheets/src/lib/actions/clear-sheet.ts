import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';

export const clearSheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'clear_sheet',
  description: 'Clears all rows on an existing sheet',
  displayName: 'Clear Sheet',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
    sheet_id: googleSheetsCommon.sheet_id,
    is_first_row_headers: Property.Checkbox({
      displayName: 'Is First row Headers?',
      description: 'If the first row is headers',
      required: true,
      defaultValue: true,
    }),
  },
  async run({ propsValue, auth }) {
    await googleSheetsCommon.findSheetName(
      auth['access_token'],
      propsValue['spreadsheet_id'],
      propsValue['sheet_id']
    );

    const rowsToDelete: number[] = [];
    const values = await googleSheetsCommon.getValues(
      propsValue.spreadsheet_id,
      auth['access_token'],
      propsValue.sheet_id
    );
    for (const key in values) {
      if (key === '0' && propsValue.is_first_row_headers) {
        continue;
      }
      rowsToDelete.push(parseInt(key) + 1);
    }

    const response = await googleSheetsCommon.clearSheet(
      propsValue.spreadsheet_id,
      propsValue.sheet_id,
      auth['access_token'],
      propsValue.is_first_row_headers ? 1 : 0,
      rowsToDelete.length
    );

    return response.body;
  },
});
