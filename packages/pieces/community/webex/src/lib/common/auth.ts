import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './client';

export const webexAuth = PieceAuth.OAuth2({
  description: 'Connect your Webex account',
  authUrl: 'https://webexapis.com/v1/authorize',
  tokenUrl: 'https://webexapis.com/v1/access_token',
  required: true,
  scope: ['spark:all', 'meeting:schedules_read'],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<WebexPerson>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/people/me`,
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body?.emails?.[0] || response.body?.displayName || undefined;
    } catch {
      return undefined;
    }
  },
});

type WebexPerson = { emails?: string[]; displayName?: string };
