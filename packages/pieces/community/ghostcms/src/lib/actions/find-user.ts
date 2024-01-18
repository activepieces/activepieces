import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../..';
import { common } from '../common';

export const findUser = createAction({
  name: 'find_user',
  displayName: 'Find User',
  description: 'Find a staff user by email',
  auth: ghostAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },

  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${context.auth.baseUrl}/ghost/api/admin/users`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.apiKey)}`,
      },
      queryParams: {
        filter: `email:${context.propsValue.email}`,
      },
    });

    return response.body;
  },
});
