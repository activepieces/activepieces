import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { githubTriggers } from './lib/trigger';

export const githubAuth = PieceAuth.OAuth2({
    displayName: "Authentication",
    required: true,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: ['admin:repo_hook', 'admin:org', 'repo'],
})

export const github = createPiece({
  displayName: "Github",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  auth: githubAuth,
  actions: [],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
