import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { githubCreateIssueAction } from './lib/actions/create-issue';
import { githubTriggers } from './lib/trigger';

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
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [githubCreateIssueAction],
  authors: ['kanarelo'],
  triggers: githubTriggers,
});
