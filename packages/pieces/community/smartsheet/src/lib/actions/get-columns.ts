import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../..';
import { getSheetColumns, smartsheetCommon } from '../common';

export const getColumnsAction = createAction({
  auth: smartsheetAuth,
  name: 'smartsheet_get_columns',
  displayName: 'Get Columns',
  description: 'Get all columns for a specific sheet',
  props: {
    sheet_id: smartsheetCommon.sheet_id(true),
    include_type: Property.Checkbox({
      displayName: 'Include Column Types',
      description: 'Include detailed column type information',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.secret_text;
    const { sheet_id } = context.propsValue;
    return await getSheetColumns(accessToken, sheet_id as string);
  },
});
