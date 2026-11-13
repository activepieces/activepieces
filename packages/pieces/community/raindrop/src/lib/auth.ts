import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { raindropClient } from './common/client';
import type { RaindropUser } from './common/types';

export const raindropAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://raindrop.io/oauth/authorize',
  tokenUrl: 'https://raindrop.io/oauth/access_token',
  scope: [],
  extra: {},
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await raindropClient.request<RaindropUser>({
        auth: { access_token: auth.access_token },
        method: HttpMethod.GET,
        path: '/user',
        timeout: 5000,
      });
      return response?.user?.email || response?.user?.fullName || undefined;
    } catch {
      return undefined;
    }
  },
});
