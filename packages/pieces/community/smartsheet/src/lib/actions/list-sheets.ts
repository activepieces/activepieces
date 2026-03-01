import { createAction } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../..';
import { listSheets } from '../common';

export const listSheets = createAction({
  auth: smartsheetAuth,
  name: 'smartsheet_list_sheets',
  displayName: 'List Sheets',
  description: 'Get a list of all sheets in your Smartsheet account',
  props: {},
  async run(context) {
    const accessToken = context.auth.secret_text;
    try {
      return await listSheets(accessToken);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new Error('Unauthorized: Invalid API token.');
      } else if (error?.response?.status === 403) {
        throw new Error('Forbidden: You do not have permission to access these sheets.');
      } else if (error?.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to list sheets: ${error?.message || error}`);
    }
  },
});
