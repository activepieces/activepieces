import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { issuesEventTrigger } from './lib/trigger/issue-event';
import { createIssueAction } from './lib/actions/create-issue-action';

export const gitlabAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://gitlab.com/oauth/authorize',
  tokenUrl: 'https://gitlab.com/oauth/token',
  scope: ['api', 'read_user'],
});

export const gitlab = createPiece({
  displayName: 'GitLab',
  auth: gitlabAuth,
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/gitlab.png',
  authors: ['kishanprmr'],
  actions: [createIssueAction],
  triggers: [issuesEventTrigger],
});
