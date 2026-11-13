import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const typeformAuth = PieceAuth.OAuth2({
  required: true,
  tokenUrl: 'https://api.typeform.com/oauth/token',
  authUrl: 'https://admin.typeform.com/oauth/authorize',
  scope: [
    'webhooks:write',
    'forms:read',
    'forms:write',
    'accounts:read',
    'responses:read',
    'responses:write',
    'workspaces:read',
    'workspaces:write',
    'themes:read',
    'themes:write',
    'images:read',
    'images:write',
    'offline',
  ],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ email?: string; alias?: string }>({
        method: HttpMethod.GET,
        url: 'https://api.typeform.com/me',
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body.email || response.body.alias || undefined;
    } catch {
      return undefined;
    }
  },
});
