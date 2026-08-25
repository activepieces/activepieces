import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserAction = createAction({
  name: 'get_user',
  displayName: 'Get User',
  description: 'Retrieve your user information',
  audience: 'both',
  aiMetadata: { description: 'Fetch the profile of the currently authenticated Zoo user (name, email, and core account fields). Read-only and repeatable. Use the get extended user info action when you need additional metadata beyond the basic profile.', idempotent: true },
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
