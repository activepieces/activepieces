import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { JiraAuth, jiraCloudAuth } from './auth';
import { createIssueAction } from './lib/actions/create-issue';
import { searchIssues } from './lib/actions/search-issues';
import { newIssue } from './lib/triggers/new-issue';
import { updatedIssue } from './lib/triggers/updated-issue';
import { updatedIssueStatus } from './lib/triggers/updated-issue-status';
import { addCommentToIssueAction } from './lib/actions/add-comment-to-issue';
import { addAttachmentToIssueAction } from './lib/actions/add-attachment-to-issue';
import { updateIssueCommentAction } from './lib/actions/update-issue-comment';
import { deleteIssueCommentAction } from './lib/actions/delete-issue-comment';
import { updateIssueAction } from './lib/actions/update-issue';
import { assignIssueAction } from './lib/actions/assign-issue';
import { listIssueCommentsAction } from './lib/actions/list-issue-comments';
import { findUserAction } from './lib/actions/find-user';
import { addWatcherToIssueAction } from './lib/actions/add-watcher-to-issue';
import { linkIssuesAction } from './lib/actions/link-issues';
import { getIssueAttachmentAction } from './lib/actions/get-issue-attachment';
import { markdownToJiraFormat } from './lib/actions/markdown-to-jira-format';

export const jiraCloud = createPiece({
	displayName: 'Jira Cloud',
	description: 'Issue tracking and project management',

	auth: jiraCloudAuth,
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: ['kishanprmr', 'MoShizzle', 'abuaboud', 'prasanna2000-max'],
	actions: [
		createIssueAction,
		updateIssueAction,
		findUserAction,
		searchIssues,
		assignIssueAction,
		addAttachmentToIssueAction,
		getIssueAttachmentAction,
		addWatcherToIssueAction,
		addCommentToIssueAction,
		updateIssueCommentAction,
		linkIssuesAction,
		listIssueCommentsAction,
		deleteIssueCommentAction,
		markdownToJiraFormat,
		createCustomApiCallAction({
			baseUrl: (auth) => {
				return `${(auth as JiraAuth).instanceUrl}/rest/api/3`;
			},
			auth: jiraCloudAuth,
			authMapping: async (auth) => {
				const typedAuth = auth as JiraAuth;
				return {
					Authorization: `Basic ${Buffer.from(`${typedAuth.email}:${typedAuth.apiToken}`).toString(
						'base64',
					)}`,
				};
			},
		}),
	],
	triggers: [newIssue, updatedIssue, updatedIssueStatus],
});
