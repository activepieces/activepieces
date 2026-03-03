import { PieceAuth } from '@activepieces/pieces-framework';

export const githubAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  scope: ['admin:repo_hook', 'admin:org', 'repo'],
});
