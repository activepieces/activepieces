import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserOrgAction = createAction({
  name: 'get_user_org',
  displayName: 'Get User Organization',
  description: 'Get the organization associated with your user account',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the organization that the authenticated Zoo user belongs to. Read-only and repeatable; takes no input.', idempotent: true },
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/org',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
