import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { giteaAuth } from './lib/auth';
import { newCommit } from './lib/triggers/new-commit';
import { newIssue } from './lib/triggers/new-issue';
import { newPullRequest } from './lib/triggers/new-pull-request';
import { workflowRunCompleted } from './lib/triggers/workflow-run';
import { createIssue } from './lib/actions/create-issue';
import { createComment } from './lib/actions/create-comment';
import { updateRepoSync } from './lib/actions/update-repo';

export const gitea = createPiece({
  displayName: 'Gitea',
  description: 'Self-hosted Git service',
  auth: giteaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/gitea.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: [],
  actions: [
    createIssue,
    createComment,
    updateRepoSync,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const authValue = auth as OAuth2PropertyValue;
        const baseUrl = (
          (authValue.props?.['baseUrl'] as string) ?? 'https://gitea.com'
        ).replace(/\/$/, '');
        return `${baseUrl}/api/v1`;
      },
      auth: giteaAuth,
      authMapping: async (auth) => {
        const authValue = auth as OAuth2PropertyValue;
        return {
          Authorization: `Bearer ${authValue.access_token}`,
        };
      },
    }),
  ],
  triggers: [newCommit, newIssue, newPullRequest, workflowRunCompleted],
});