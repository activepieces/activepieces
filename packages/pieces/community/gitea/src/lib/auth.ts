import { PieceAuth, Property } from '@activepieces/pieces-framework';

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
  scope: ['read:repository', 'write:repository', 'read:issue', 'write:issue'],
});
