import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from './auth';
import { createIssueAction } from './lib/actions/create-issue';
import { searchIssuesAction } from './lib/actions/search-issues';
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
import { getIssueAction } from './lib/actions/get-issue';
import { transitionIssueAction } from './lib/actions/transition-issue';
import { jiraBaseUrl, jiraToken } from './lib/common';

export const jiraDataCenter = createPiece({
	displayName: 'Jira Data Center',
	description: 'Issue tracking and project management for Jira Data Center and Server',

	auth: jiraDataCenterAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: [],
	actions: [
		createIssueAction,
		updateIssueAction,
		getIssueAction,
		findUserAction,
		searchIssuesAction,
		assignIssueAction,
		transitionIssueAction,
		addAttachmentToIssueAction,
		getIssueAttachmentAction,
		addWatcherToIssueAction,
		addCommentToIssueAction,
		updateIssueCommentAction,
		linkIssuesAction,
		listIssueCommentsAction,
		deleteIssueCommentAction,
		createCustomApiCallAction({
			baseUrl: (auth) => (auth ? jiraBaseUrl(auth) : ''),
			auth: jiraDataCenterAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${jiraToken(auth)}`,
			}),
			props: {
				url: {
					description: "Full URL, or a path relative to your Jira site's /rest/api/2.",
					placeholder: '/issue/PROJ-123',
				},
			},
		}),
	],
	triggers: [newIssue, updatedIssue, updatedIssueStatus],
});
