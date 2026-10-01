import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const gitlabAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://gitlab.com/oauth/authorize',
  tokenUrl: 'https://gitlab.com/oauth/token',
  scope: ['api', 'read_user'],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ email?: string; username?: string }>({
        method: HttpMethod.GET,
        url: 'https://gitlab.com/api/v4/user',
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body.email || response.body.username || undefined;
    } catch {
      return undefined;
    }
  },
});
