import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { KLENTY_API_BASE, KLENTY_DOCS_API_BASE } from './common/constants';

async function validateHost(
  baseUrl: string,
  username: string,
  apiKey: string,
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
To authenticate with Klenty, provide:
1. Your Klenty username/email used in the API path
2. Your Klenty API key

Evidence:
- Klenty public help articles document user-scoped endpoints at /apis/v1/user/{username}
- Pipedream's maintained Klenty component sends the API key using the x-API-key header

This piece sends both x-API-key and api_key for compatibility when references differ.
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
      if (
        await validateHost(KLENTY_API_BASE, auth.username, auth.apiKey)
      ) {
        return { valid: true };
      }
    } catch {
      // Try the docs host below
    }

    try {
      if (
        await validateHost(KLENTY_DOCS_API_BASE, auth.username, auth.apiKey)
      ) {
        return { valid: true };
      }
    } catch {
      // ignore and return invalid below
    }

    return {
      valid: false,
      error:
        'Invalid Klenty credentials. Verify the username/email used in the path and the API key.',
    };
  },
});
