import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { CLARITIA_API, CLARITIA_BASE } from './common';

export const claritiaAuth = PieceAuth.OAuth2({
  description: 'Sign in to Claritia and pick the workspace to connect.',
  required: true,
  authUrl: `${CLARITIA_BASE}/oauth/authorize`,
  tokenUrl: `${CLARITIA_BASE}/api/oauth/token`,
  scope: ['forms'],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const r = await httpClient.sendRequest<{ workspace?: { name?: string } }>({
        method: HttpMethod.GET,
        url: `${CLARITIA_API}/me`,
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return r.body.workspace?.name || undefined;
    } catch {
      return undefined;
    }
  },
});
