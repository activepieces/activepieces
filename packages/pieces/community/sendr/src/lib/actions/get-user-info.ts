import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall, flattenObject } from '../common';

export const getUserInfo = createAction({
  auth: sendrAuth,
  name: 'get_user_info',
  displayName: 'Get Account Info',
  description: 'Returns information about the currently connected Sendr API user. Useful for verifying that your API key is valid.',
  props: {},
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/seat/me',
    });
    return flattenObject(response.body);
  },
});
