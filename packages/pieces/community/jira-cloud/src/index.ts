import { createPiece } from '@activepieces/pieces-framework'

import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { PieceCategory } from '@activepieces/shared'
import { JiraAuth, jiraCloudAuth } from './auth'
import { addAttachmentToIssueAction } from './lib/actions/add-attachment-to-issue'
import { addCommentToIssueAction } from './lib/actions/add-comment-to-issue'
import { addWatcherToIssueAction } from './lib/actions/add-watcher-to-issue'
import { assignIssueAction } from './lib/actions/assign-issue'
import { createIssueAction } from './lib/actions/create-issue'
import { deleteIssueCommentAction } from './lib/actions/delete-issue-comment'
import { findUserAction } from './lib/actions/find-user'
import { linkIssuesAction } from './lib/actions/link-issues'
import { listIssueCommentsAction } from './lib/actions/list-issue-comments'
import { searchIssues } from './lib/actions/search-issues'
import { updateIssueAction } from './lib/actions/update-issue'
import { updateIssueCommentAction } from './lib/actions/update-issue-comment'
import { newIssue } from './lib/triggers/new-issue'
import { updatedIssue } from './lib/triggers/updated-issue'

export const jiraCloud = createPiece({
  displayName: 'Jira Cloud',
  description: 'Issue tracking and project management',

  auth: jiraCloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    createIssueAction,
    updateIssueAction,
    findUserAction,
    searchIssues,
    assignIssueAction,
    addAttachmentToIssueAction,
    addWatcherToIssueAction,
    addCommentToIssueAction,
    updateIssueCommentAction,
    linkIssuesAction,
    listIssueCommentsAction,
    deleteIssueCommentAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return `${(auth as JiraAuth).instanceUrl}/rest/api/3`
      },
      auth: jiraCloudAuth,
      authMapping: async (auth) => {
        const typedAuth = auth as JiraAuth
        return {
          Authorization: `Basic ${Buffer.from(`${typedAuth.email}:${typedAuth.apiToken}`).toString('base64')}`,
        }
      },
    }),
  ],
  triggers: [newIssue, updatedIssue],
})
