import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const giteaAuth = PieceAuth.OAuth2({
  displayName: 'OAuth2',
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
  scope: ['repo'],
});
