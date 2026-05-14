import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sheetDropdown, sendrApiCall, flattenObject } from '../common';

export const getSheet = createAction({
  auth: sendrAuth,
  name: 'get_sheet',
  displayName: 'Get Sheet',
  description: 'Returns details of a specific contact list (sheet).',
  props: {
    sheet: sheetDropdown,
  },
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: `/sheet/${context.propsValue.sheet}`,
    });
    return flattenObject(response.body);
  },
});
