import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
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
import { getIssueAction } from './lib/actions/get-issue';
import { transitionIssueAction } from './lib/actions/transition-issue';
import { newComment } from './lib/triggers/new-comment';
import { issueAssigned } from './lib/triggers/issue-assigned';
import { newAttachment } from './lib/triggers/new-attachment';
import { newIssueType } from './lib/triggers/new-issue-type';
import { newProject } from './lib/triggers/new-project';
import { newPriority } from './lib/triggers/new-priority';
import { addCommentAiAction } from './lib/actions/ai/add-comment';
import { addWatcherAiAction } from './lib/actions/ai/add-watcher';
import { addWorklogAiAction } from './lib/actions/ai/add-worklog';
import { assignIssueToUserAiAction } from './lib/actions/ai/assign-issue-to-user';
import { bulkCreateIssuesAiAction } from './lib/actions/ai/bulk-create-issues';
import { bulkGetIssuesAiAction } from './lib/actions/ai/bulk-get-issues';
import { countIssuesAiAction } from './lib/actions/ai/count-issues';
import { createBoardAiAction } from './lib/actions/ai/create-board';
import { createIssueLinkAiAction } from './lib/actions/ai/create-issue-link';
import { createIssueWithFieldsAiAction } from './lib/actions/ai/create-issue-with-fields';
import { createSprintAiAction } from './lib/actions/ai/create-sprint';
import { deleteAttachmentAiAction } from './lib/actions/ai/delete-attachment';
import { deleteCommentAiAction } from './lib/actions/ai/delete-comment';
import { deleteIssueAiAction } from './lib/actions/ai/delete-issue';
import { deleteWorklogAiAction } from './lib/actions/ai/delete-worklog';
import { downloadAttachmentAiAction } from './lib/actions/ai/download-attachment';
import { editIssueAiAction } from './lib/actions/ai/edit-issue';
import { fetchIssueAiAction } from './lib/actions/ai/fetch-issue';
import { findUsersAiAction } from './lib/actions/ai/find-users';
import { getCommentAiAction } from './lib/actions/ai/get-comment';
import { getCurrentUserAiAction } from './lib/actions/ai/get-current-user';
import { getFavoriteFiltersAiAction } from './lib/actions/ai/get-favorite-filters';
import { getFieldsAiAction } from './lib/actions/ai/get-fields';
import { getFilterAiAction } from './lib/actions/ai/get-filter';
import { getIssueEditMetadataAiAction } from './lib/actions/ai/get-issue-edit-metadata';
import { getIssueLinkTypesAiAction } from './lib/actions/ai/get-issue-link-types';
import { getIssueResolutionsAiAction } from './lib/actions/ai/get-issue-resolutions';
import { getIssueTransitionsAiAction } from './lib/actions/ai/get-issue-transitions';
import { getIssueTypeCreateFieldsAiAction } from './lib/actions/ai/get-issue-type-create-fields';
import { getIssueTypesAiAction } from './lib/actions/ai/get-issue-types';
import { getIssueVotesAiAction } from './lib/actions/ai/get-issue-votes';
import { getIssueWatchersAiAction } from './lib/actions/ai/get-issue-watchers';
import { getJqlFieldSuggestionsAiAction } from './lib/actions/ai/get-jql-field-suggestions';
import { getJqlReferenceDataAiAction } from './lib/actions/ai/get-jql-reference-data';
import { getMyPermissionsAiAction } from './lib/actions/ai/get-my-permissions';
import { getPermittedProjectsAiAction } from './lib/actions/ai/get-permitted-projects';
import { getPrioritiesAiAction } from './lib/actions/ai/get-priorities';
import { getProjectComponentsAiAction } from './lib/actions/ai/get-project-components';
import { getProjectVersionsAiAction } from './lib/actions/ai/get-project-versions';
import { getProjectAiAction } from './lib/actions/ai/get-project';
import { getRecentProjectsAiAction } from './lib/actions/ai/get-recent-projects';
import { getRemoteIssueLinksAiAction } from './lib/actions/ai/get-remote-issue-links';
import { getSprintAiAction } from './lib/actions/ai/get-sprint';
import { getStatusesAiAction } from './lib/actions/ai/get-statuses';
import { getUserGroupsAiAction } from './lib/actions/ai/get-user-groups';
import { getWorklogsAiAction } from './lib/actions/ai/get-worklogs';
import { listBoardsAiAction } from './lib/actions/ai/list-boards';
import { listCommentsAiAction } from './lib/actions/ai/list-comments';
import { listProjectsAiAction } from './lib/actions/ai/list-projects';
import { listSprintsAiAction } from './lib/actions/ai/list-sprints';
import { moveIssuesToSprintAiAction } from './lib/actions/ai/move-issues-to-sprint';
import { parseJqlAiAction } from './lib/actions/ai/parse-jql';
import { removeWatcherAiAction } from './lib/actions/ai/remove-watcher';
import { searchDashboardsAiAction } from './lib/actions/ai/search-dashboards';
import { searchFiltersAiAction } from './lib/actions/ai/search-filters';
import { searchIssuesByJqlAiAction } from './lib/actions/ai/search-issues-by-jql';
import { sendIssueNotificationAiAction } from './lib/actions/ai/send-issue-notification';
import { transitionIssueStatusAiAction } from './lib/actions/ai/transition-issue-status';
import { updateCommentAiAction } from './lib/actions/ai/update-comment';
import { uploadAttachmentAiAction } from './lib/actions/ai/upload-attachment';

export const jiraCloud = createPiece({
	displayName: 'Jira Cloud',
	description: 'Issue tracking and project management',

	auth: jiraCloudAuth,
	minimumSupportedRelease: '0.87.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: ['kishanprmr', 'MoShizzle', 'abuaboud', 'prasanna2000-max', 'sanket-a11y'],
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
		getIssueAction,
		transitionIssueAction,
		addCommentAiAction,
		addWatcherAiAction,
		addWorklogAiAction,
		assignIssueToUserAiAction,
		bulkCreateIssuesAiAction,
		bulkGetIssuesAiAction,
		countIssuesAiAction,
		createBoardAiAction,
		createIssueLinkAiAction,
		createIssueWithFieldsAiAction,
		createSprintAiAction,
		deleteAttachmentAiAction,
		deleteCommentAiAction,
		deleteIssueAiAction,
		deleteWorklogAiAction,
		downloadAttachmentAiAction,
		editIssueAiAction,
		fetchIssueAiAction,
		findUsersAiAction,
		getCommentAiAction,
		getCurrentUserAiAction,
		getFavoriteFiltersAiAction,
		getFieldsAiAction,
		getFilterAiAction,
		getIssueEditMetadataAiAction,
		getIssueLinkTypesAiAction,
		getIssueResolutionsAiAction,
		getIssueTransitionsAiAction,
		getIssueTypeCreateFieldsAiAction,
		getIssueTypesAiAction,
		getIssueVotesAiAction,
		getIssueWatchersAiAction,
		getJqlFieldSuggestionsAiAction,
		getJqlReferenceDataAiAction,
		getMyPermissionsAiAction,
		getPermittedProjectsAiAction,
		getPrioritiesAiAction,
		getProjectComponentsAiAction,
		getProjectVersionsAiAction,
		getProjectAiAction,
		getRecentProjectsAiAction,
		getRemoteIssueLinksAiAction,
		getSprintAiAction,
		getStatusesAiAction,
		getUserGroupsAiAction,
		getWorklogsAiAction,
		listBoardsAiAction,
		listCommentsAiAction,
		listProjectsAiAction,
		listSprintsAiAction,
		moveIssuesToSprintAiAction,
		parseJqlAiAction,
		removeWatcherAiAction,
		searchDashboardsAiAction,
		searchFiltersAiAction,
		searchIssuesByJqlAiAction,
		sendIssueNotificationAiAction,
		transitionIssueStatusAiAction,
		updateCommentAiAction,
		uploadAttachmentAiAction,
		createCustomApiCallAction({
			baseUrl: (auth) => {
				return auth ? `${(auth).props.instanceUrl}/rest/api/3` : '';
			},
			auth: jiraCloudAuth,
			authMapping: async (auth) => {
				const typedAuth = auth as JiraAuth;
				return {
					Authorization: `Basic ${Buffer.from(`${typedAuth.props.email}:${typedAuth.props.apiToken}`).toString(
						'base64',
					)}`,
				};
			},
		}),
	],
	triggers: [newIssue, updatedIssue, updatedIssueStatus, newComment, issueAssigned, newAttachment, newIssueType, newProject, newPriority],
});
