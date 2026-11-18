import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';

import { youtrackAuth } from './lib/auth';
import { youtrackClient } from './lib/common/client';

import { createIssueAction } from './lib/actions/create-issue';
import { getIssueAction } from './lib/actions/get-issue';
import { searchIssuesAction } from './lib/actions/search-issues';
import { updateIssueAction } from './lib/actions/update-issue';
import { applyCommandAction } from './lib/actions/apply-command';
import { addTagToIssueAction } from './lib/actions/add-tag-to-issue';
import { removeTagFromIssueAction } from './lib/actions/remove-tag-from-issue';
import { createTagAction } from './lib/actions/create-tag';
import { listTagsAction } from './lib/actions/list-tags';
import { uploadAttachmentAction } from './lib/actions/upload-attachment';
import { deleteAttachmentAction } from './lib/actions/delete-attachment';
import { downloadAttachmentAction } from './lib/actions/download-attachment';
import { getIssueHistoryAction } from './lib/actions/get-issue-history';
import { addCommentAction } from './lib/actions/add-comment';
import { listCommentsAction } from './lib/actions/list-comments';
import { addUserToTeamAction } from './lib/actions/add-user-to-team';
import { linkIssuesAction } from './lib/actions/link-issues';
import { listAttachmentsAction } from './lib/actions/list-attachments';
import { listProjectsAction } from './lib/actions/list-projects';
import { getProjectAction } from './lib/actions/get-project';
import { listProjectCustomFieldsAction } from './lib/actions/list-project-custom-fields';
import { findUsersAction } from './lib/actions/find-users';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { listGroupsAction } from './lib/actions/list-groups';
import { listAgileBoardsAction } from './lib/actions/list-agile-boards';
import { listSprintsAction } from './lib/actions/list-sprints';
import { createSprintAction } from './lib/actions/create-sprint';
import { addIssueToSprintAction } from './lib/actions/add-issue-to-sprint';
import { listLinkTypesAction } from './lib/actions/list-link-types';
import { getIssueLinksAction } from './lib/actions/get-issue-links';
import { findWorkItemsAction } from './lib/actions/find-work-items';
import { addWorkItemAction } from './lib/actions/add-work-item';
import { deleteWorkItemAction } from './lib/actions/delete-work-item';
import { searchArticlesAction } from './lib/actions/search-articles';
import { getArticleAction } from './lib/actions/get-article';
import { createArticleAction } from './lib/actions/create-article';
import { updateArticleAction } from './lib/actions/update-article';
import { listSavedSearchesAction } from './lib/actions/list-saved-searches';
import { deleteIssueAction } from './lib/actions/delete-issue';
import { updateCommentAction } from './lib/actions/update-comment';
import { deleteCommentAction } from './lib/actions/delete-comment';
import { newIssueTrigger } from './lib/triggers/new-issue';
import { updatedIssueTrigger } from './lib/triggers/updated-issue';

export { youtrackAuth };

export const youtrack = createPiece({
  displayName: 'YouTrack',
  description: 'JetBrains project management and issue tracking for agile teams.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/youtrack.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: youtrackAuth,
  authors: ['cumonvip1', 'OdaiAhmed99'],
  actions: [
    createIssueAction,
    getIssueAction,
    searchIssuesAction,
    updateIssueAction,
    applyCommandAction,
    addTagToIssueAction,
    removeTagFromIssueAction,
    createTagAction,
    listTagsAction,
    uploadAttachmentAction,
    deleteAttachmentAction,
    downloadAttachmentAction,
    getIssueHistoryAction,
    addCommentAction,
    listCommentsAction,
    addUserToTeamAction,
    linkIssuesAction,
    listAttachmentsAction,
    listProjectsAction,
    getProjectAction,
    listProjectCustomFieldsAction,
    findUsersAction,
    getCurrentUserAction,
    listGroupsAction,
    listAgileBoardsAction,
    listSprintsAction,
    createSprintAction,
    addIssueToSprintAction,
    listLinkTypesAction,
    getIssueLinksAction,
    findWorkItemsAction,
    addWorkItemAction,
    deleteWorkItemAction,
    searchArticlesAction,
    getArticleAction,
    createArticleAction,
    updateArticleAction,
    listSavedSearchesAction,
    deleteIssueAction,
    updateCommentAction,
    deleteCommentAction,
    createCustomApiCallAction({
      baseUrl: (auth) => youtrackClient.normalizeBaseUrl(auth?.props.baseUrl) + '/api',
      auth: youtrackAuth,
      authMapping: async (auth) => {
        return { Authorization: 'Bearer ' + String(auth.props.apiToken).trim() };
      },
    }),
  ],
  triggers: [newIssueTrigger, updatedIssueTrigger],
});
