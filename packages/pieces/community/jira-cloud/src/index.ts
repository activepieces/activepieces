import { createPiece } from '@activepieces/pieces-framework';

import { jiraCloudAuth } from './auth';
import { createIssue } from './lib/actions/create-issue';
import { searchIssues } from './lib/actions/search-issues';
import { newIssue } from './lib/triggers/new-issue';
import { updatedIssue } from './lib/triggers/updated-issue';

export const jiraCloud = createPiece({
  displayName: 'Jira Cloud',
  auth: jiraCloudAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
  authors: ['MoShizzle'],
  actions: [createIssue, searchIssues],
  triggers: [newIssue, updatedIssue],
});
