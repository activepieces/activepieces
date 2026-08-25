import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createApiTokenAction = createAction({
  name: 'create_api_token',
  displayName: 'Create API Token',
  description: 'Create a new API token for your user account',
  audience: 'both',
  aiMetadata: { description: 'Create a new API token on the authenticated user\'s account with the given name and return the token value. Use to provision programmatic access for the user. Not idempotent: each call mints a distinct token even if the name repeats.', idempotent: false },
  auth: zooAuth,
  // category: 'API Tokens',
  props: {
    name: Property.ShortText({
      displayName: 'Token Name',
      required: true,
      description: 'A name to identify this token',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/user/api-tokens',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        name: propsValue.name,
      },
    });
    return response.body;
  },
});
