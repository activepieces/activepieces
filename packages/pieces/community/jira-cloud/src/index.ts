import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { JiraAuth, jiraCloudAuth } from './auth';
import { createIssue } from './lib/actions/create-issue';
import { searchIssues } from './lib/actions/search-issues';
import { newIssue } from './lib/triggers/new-issue';
import { updatedIssue } from './lib/triggers/updated-issue';

export const jiraCloud = createPiece({
  displayName: 'Jira Cloud',
  description: 'Issue tracking and project management',

  auth: jiraCloudAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createIssue,
    searchIssues,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return `${(auth as JiraAuth).instanceUrl}/rest/api/3`;
      },
      auth: jiraCloudAuth,
      authMapping: (auth) => {
        const typedAuth = auth as JiraAuth;
        return {
          Authorization: `Basic ${Buffer.from(
            `${typedAuth.email}:${typedAuth.apiToken}`
          ).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [newIssue, updatedIssue],
});
