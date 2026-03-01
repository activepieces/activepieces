import { createAction } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../..';
import { getSheet, smartsheetCommon } from '../common';

export const getSheetById = createAction({
  auth: smartsheetAuth,
  name: 'smartsheet_get_sheet',
  displayName: 'Get Sheet',
  description: 'Get detailed information about a specific sheet including rows and columns',
  props: {
    sheet_id: smartsheetCommon.sheet_id(true),
  },
  async run(context) {
    const accessToken = context.auth.secret_text;
    const { sheet_id } = context.propsValue;
    try {
      return await getSheet(accessToken, sheet_id as string);
    } catch (error: any) {
      if (error?.response?.status === 400) {
        throw new Error('Bad request. Please check the sheet ID.');
      } else if (error?.response?.status === 403) {
        throw new Error('Forbidden: You do not have access to this sheet.');
      } else if (error?.response?.status === 404) {
        throw new Error('Sheet not found. Please verify the sheet ID.');
      } else if (error?.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to get sheet: ${error?.message || error}`);
    }
  },
});
