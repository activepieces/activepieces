import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const simplybookAuth = PieceAuth.CustomAuth({
  description: 'Enter your Simplybook API key to authenticate',
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Simplybook API key',
      required: true
    }),
    companyLogin: Property.ShortText({
      displayName: 'Company Login',
      description: 'Your Simplybook company login (e.g., "yourcompany" from yourcompany.simplybook.me)',
      required: true
    })
  },
  required: true
});

export type SimplybookAuth = {
  apiKey: string;
  companyLogin: string;
};

/**
 * Get access token for Simplybook API
 * Simplybook API methods require authentication via access-token.
 * This token is obtained by calling getToken on http://user-api.simplybook.me/login
 * service with your personal API-key.
 */
export async function getAccessToken(auth: SimplybookAuth): Promise<string> {
  const response = await httpClient.sendRequest<string>({
    method: HttpMethod.POST,
    url: 'http://user-api.simplybook.me/login',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      jsonrpc: '2.0',
      method: 'getToken',
      params: [auth.companyLogin, auth.apiKey],
      id: 1
    }
  });

  if (response.body && typeof response.body === 'object' && 'result' in response.body) {
    return (response.body as any).result;
  }

  throw new Error('Failed to get access token from Simplybook API');
}
