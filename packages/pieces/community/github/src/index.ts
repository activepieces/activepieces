import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { githubCreateIssueAction } from './lib/actions/create-issue';
import { githubUnlockIssueAction } from './lib/actions/unlock-issue';
import { githubTriggers } from './lib/trigger';
import { githubGetIssueInformation } from './lib/actions/get-issue-information';
import { githubCreateCommentOnAIssue } from './lib/actions/create-comment-on-a-issue';
import { githubLockIssueAction } from './lib/actions/lock-issue';
import { githubRawGraphqlQuery } from './lib/actions/raw-graphql-query';

export const githubAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  scope: ['admin:repo_hook', 'admin:org', 'repo'],
});

export const github = createPiece({
  displayName: 'GitHub',
  description:
    'Developer platform that allows developers to create, store, manage and share their code',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: githubAuth,
  actions: [
    githubCreateIssueAction,
    githubGetIssueInformation,
    githubCreateCommentOnAIssue,
    githubLockIssueAction,
    githubUnlockIssueAction,
    githubRawGraphqlQuery,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.github.com',
      auth: githubAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  authors: [
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'tintinthedev',
  ],
  triggers: githubTriggers,
});
