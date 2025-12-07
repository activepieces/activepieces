import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../..';
import { getSheet, smartsheetCommon } from '../common';

export const getSheetAction = createAction({
  auth: smartsheetAuth,
  name: 'smartsheet_get_sheet',
  displayName: 'Get Sheet',
  description: 'Get detailed information about a specific sheet including rows and columns',
  props: {
    sheet_id: smartsheetCommon.sheet_id(true),
    include_rows: Property.Checkbox({
      displayName: 'Include Rows',
      description: 'Include all rows in the response',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.secret_text;
    const { sheet_id } = context.propsValue;
    return await getSheet(accessToken, sheet_id as string);
  },
});
