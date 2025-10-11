import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const findUserByEmail = createAction({
  auth: oktaAuth,
  name: 'find_user_by_email',
  displayName: 'Find User by Email',
  description: 'Look up an Okta user by their email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to search for',
      required: true,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { email } = context.propsValue;

    const searchQuery = encodeURIComponent(`profile.email eq "${email}"`);
    const url = `https://${domain}/api/v1/users?search=${searchQuery}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${apiToken}`,
      },
    });

    return response.body;
  },
});
