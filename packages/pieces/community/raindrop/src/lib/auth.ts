import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const raindropAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://raindrop.io/oauth/authorize',
  tokenUrl: 'https://raindrop.io/oauth/access_token',
  scope: [],
  extra: {},
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<RaindropUser>({
        method: HttpMethod.GET,
        url: 'https://api.raindrop.io/rest/v1/user',
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body?.user?.email || response.body?.user?.fullName || undefined;
    } catch {
      return undefined;
    }
  },
});

type RaindropUser = { user?: { email?: string; fullName?: string } };
