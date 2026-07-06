import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteApiTokenAction = createAction({
  name: 'delete_api_token',
  displayName: 'Delete API Token',
  description: 'Delete an API token from your user account',
  audience: 'both',
  aiMetadata: { description: 'Permanently revoke the API token identified by its value from the authenticated user\'s account. Use to invalidate a token; destructive. Not strictly idempotent: a first call deletes it and a repeat may error if the token no longer exists.', idempotent: false },
  auth: zooAuth,
  // category: 'API Tokens',
  props: {
    token: Property.ShortText({
      displayName: 'Token',
      required: true,
      description: 'The token to delete',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.zoo.dev/user/api-tokens/${propsValue.token}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
