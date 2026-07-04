import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOAuth2ProvidersAction = createAction({
  name: 'get_oauth2_providers',
  displayName: 'Get OAuth2 Providers',
  description: 'Get the OAuth2 providers available for your user account',
  audience: 'both',
  aiMetadata: { description: 'List the OAuth2 identity providers available for the authenticated Zoo user account. Read-only and repeatable; takes no input.', idempotent: true },
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/oauth2/providers',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
