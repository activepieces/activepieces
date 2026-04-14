import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { KLENTY_API_BASE, KLENTY_DOCS_API_BASE } from './common/constants';

async function validateHost(
  baseUrl: string,
  username: string,
  apiKey: string
): Promise<boolean> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${baseUrl}/user/${encodeURIComponent(username)}/lists`,
    headers: {
      'x-API-key': apiKey,
      api_key: apiKey,
      accept: 'application/json',
    },
  });

  return response.status >= 200 && response.status < 300;
}

export const klentyAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
**Generating Klenty API Key**

To access the Klenty REST APIs, you need to authenticate your requests using the Klenty API Key.

1. Login to your Klenty account.
2. Go to **Settings → Integrations → Klenty API Key**.
3. Click on the key icon to generate an API Key.
  `,
  props: {
    username: Property.ShortText({
      displayName: 'Username / Email',
      description:
        'The Klenty username or email used in the API URL path (for example: you@company.com).',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Klenty API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await validateHost(KLENTY_API_BASE, auth.username, auth.apiKey);
      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error:
          'Invalid Klenty credentials. Verify the username/email used in the path and the API key.',
      };
    }
  },
});
