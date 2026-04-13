import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { JiraDataCenterAuth, jiraDataCenterAuth } from './auth';
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

export const jiraDataCenter = createPiece({
	displayName: 'Jira Data Center',
	description: 'Issue tracking and project management for Jira Data Center and Server',

	auth: jiraDataCenterAuth,
	minimumSupportedRelease: '0.36.1',
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
		addAttachmentToIssueAction,
		getIssueAttachmentAction,
		addWatcherToIssueAction,
		addCommentToIssueAction,
		updateIssueCommentAction,
		linkIssuesAction,
		listIssueCommentsAction,
		deleteIssueCommentAction,
		createCustomApiCallAction({
			baseUrl: (auth) => {
				return auth ? `${(auth as JiraDataCenterAuth).props.instanceUrl}/rest/api/2` : '';
			},
			auth: jiraDataCenterAuth,
			authMapping: async (auth) => {
				const typedAuth = auth as JiraDataCenterAuth;
				return {
					Authorization: `Bearer ${typedAuth.props.personalAccessToken}`,
				};
			},
		}),
	],
	triggers: [newIssue, updatedIssue, updatedIssueStatus],
});
