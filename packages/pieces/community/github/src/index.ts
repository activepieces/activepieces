import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { githubTriggers } from './lib/trigger';
import { githubCreateIssueAction } from './lib/actions/create-issue';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const githubAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  scope: ['admin:repo_hook', 'admin:org', 'repo'],
});

export const github = createPiece({
  displayName: 'GitHub',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  auth: githubAuth,
  actions: [
    githubCreateIssueAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.github.com',
      auth: githubAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
