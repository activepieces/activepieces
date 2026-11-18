import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const giteaAuth = PieceAuth.OAuth2({
  description: 'To connect Gitea, create an OAuth2 application in your Gitea instance: **Settings → Applications → Manage OAuth2 Applications → Create Application**. Set the redirect URI to the one provided by Activepieces, then copy the Client ID and Client Secret here.',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Enter your Gitea instance URL (e.g., https://gitea.com)',
      required: true,
      defaultValue: 'https://gitea.com',
    }),
  },
  authUrl: '{baseUrl}/login/oauth/authorize',
  tokenUrl: '{baseUrl}/login/oauth/access_token',
  required: true,
  scope: ['read:repository', 'write:repository', 'read:issue', 'write:issue', 'read:user'],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const instanceUrl = auth.props?.['baseUrl'] || 'https://gitea.com';
      const response = await httpClient.sendRequest<GiteaUser>({
        method: HttpMethod.GET,
        url: `${instanceUrl.replace(/\/$/, '')}/api/v1/user`,
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body?.email || response.body?.login || undefined;
    } catch {
      return undefined;
    }
  },
});

type GiteaUser = { email?: string; login?: string };
