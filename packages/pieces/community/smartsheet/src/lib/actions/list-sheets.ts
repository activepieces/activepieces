import { createAction } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../..';
import { listSheets } from '../common';

export const listSheetsAction = createAction({
  auth: smartsheetAuth,
  name: 'smartsheet_list_sheets',
  displayName: 'List Sheets',
  description: 'Get a list of all sheets in your Smartsheet account',
  props: {},
  async run(context) {
    const accessToken = context.auth.secret_text;
    return await listSheets(accessToken);
  },
});
