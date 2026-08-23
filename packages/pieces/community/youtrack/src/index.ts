// =============================================================================
// YouTrack Piece - Main Entry Point
// =============================================================================

import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';

import { youtrackAuth } from './lib/auth';

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
  authors: ['cumonvip1'],
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
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const baseUrl = auth?.props.baseUrl ?? '';
        return baseUrl.replace(/\/+$/, '') + '/api';
      },
      auth: youtrackAuth,
      authMapping: async (auth) => {
        return { Authorization: 'Bearer ' + auth.props.apiToken };
      },
    }),
  ],
  triggers: [newIssueTrigger, updatedIssueTrigger],
});
