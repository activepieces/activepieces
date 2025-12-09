import { createAction } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserInfo = createAction({
  auth: promptmateAuth,
  name: 'get_user_info',
  displayName: 'Get User Information',
  description: 'Retrieve user information associated with the API key',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.promptmate.io/v1/userInfo',
      headers: {
        'x-api-key': auth.secret_text,
      },
    });

    return response.body;
  },
});
