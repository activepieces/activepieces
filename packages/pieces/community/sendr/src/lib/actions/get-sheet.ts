import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sheetDropdown, sendrApiCall, flattenObject } from '../common';

export const getSheet = createAction({
  auth: sendrAuth,
  name: 'get_sheet',
  displayName: 'Get Sheet',
  description: 'Returns details of a specific contact list (sheet).',
  audience: 'both',
  aiMetadata: { description: 'Fetches details of a single contact list (sheet) by its id. Use it after List Sheets to inspect a specific sheet. Read-only; requires the sheet id.', idempotent: true },
  props: {
    sheet: sheetDropdown,
  },
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/sheet/${context.propsValue.sheet}`,
    });
    return flattenObject(response.body);
  },
});
