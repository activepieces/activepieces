import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserSessionAction = createAction({
  name: 'get_user_session',
  displayName: 'Get User Session',
  description: 'Get details about a specific user session',
  audience: 'both',
  aiMetadata: { description: 'Look up details of a specific Zoo user session by its session token. Read-only and repeatable. Requires the session token of the session you want to inspect.', idempotent: true },
  auth: zooAuth,
  // category: 'Users',
  props: {
    token: Property.ShortText({
      displayName: 'Session Token',
      required: true,
      description: 'The token of the session to retrieve',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/user/session/${propsValue.token}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
