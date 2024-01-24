import { createPiece } from '@activepieces/pieces-framework';

import { JiraAuth, jiraCloudAuth } from './auth';
import { createIssue } from './lib/actions/create-issue';
import { searchIssues } from './lib/actions/search-issues';
import { newIssue } from './lib/triggers/new-issue';
import { updatedIssue } from './lib/triggers/updated-issue';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const jiraCloud = createPiece({
  displayName: 'Jira Cloud',
  auth: jiraCloudAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
  authors: ['MoShizzle'],
  actions: [
    createIssue,
    searchIssues,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return `${(auth as JiraAuth).instanceUrl}/rest/api/3`
      },
      auth: jiraCloudAuth,
      authMapping: (auth) => {
        const typedAuth = auth as JiraAuth
        return {
          'Authorization': `Basic ${typedAuth.email}:${typedAuth.apiToken}`
        }
      }
    })
  ],
  triggers: [newIssue, updatedIssue],
});
