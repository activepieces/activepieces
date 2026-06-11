import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getExtendedUserAction = createAction({
  name: 'get_extended_user',
  displayName: 'Get Extended User Info',
  description: 'Retrieve extended information about your user account',
  audience: 'both',
  aiMetadata: { description: 'Fetch extended account details for the authenticated Zoo user beyond the basic profile. Read-only and repeatable. Prefer the plain get user action when only the core profile is needed.', idempotent: true },
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/extended',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
