import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getApiTokenAction = createAction({
  name: 'get_api_token',
  displayName: 'Get API Token',
  description: 'Retrieve details of a specific API token',
  audience: 'both',
  aiMetadata: { description: 'Look up one API token by its value on the authenticated user\'s account and return its details. Use when you already have the token value; to discover tokens first use the list API tokens action. Read-only and idempotent.', idempotent: true },
  auth: zooAuth,
  // category: 'API Tokens',
  props: {
    token: Property.ShortText({
      displayName: 'Token',
      required: true,
      description: 'The token to retrieve details for',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/user/api-tokens/${propsValue.token}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
