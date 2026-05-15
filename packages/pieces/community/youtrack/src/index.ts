// =============================================================================
// YouTrack Piece - Main Entry Point
// =============================================================================

import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

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

export const youtrackAuth = PieceAuth.CustomAuth({
  displayName: 'YouTrack Connection',
  description:
    'Connect your YouTrack instance.\n\n' +
    '**How to get your permanent token:**\n' +
    '1. Log in to your YouTrack instance\n' +
    '2. Click your avatar -> **Profile** -> **Authentication** tab\n' +
    '3. Click **New permanent token**\n' +
    '4. Name it (e.g. "Activepieces") and click **Create**\n' +
    '5. **Copy the token immediately** - it is shown only once\n' +
    '6. Paste it below with your Instance URL\n\n' +
    'Your **Instance URL** is your browser address, e.g. https://example.youtrack.cloud',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Your YouTrack URL (e.g. https://example.youtrack.cloud). Do NOT include /api.',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'Permanent Token',
      description: 'From Profile -> Authentication -> Permanent Tokens. Starts with "perm:".',
      required: true,
    }),
  },
});

export const youtrack = createPiece({
  displayName: 'YouTrack',
  description: 'JetBrains project management and issue tracking for agile teams.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/png/jetbrains-youtrack.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: youtrackAuth,
  authors: ['simon1400'],
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
        const a = auth as unknown as { baseUrl: string; apiToken: string };
        return a.baseUrl.replace(/\/+$/, '') + '/api';
      },
      auth: youtrackAuth,
      authMapping: async (auth) => {
        const a = auth as unknown as { apiToken: string };
        return { Authorization: 'Bearer ' + a.apiToken };
      },
    }),
  ],
  triggers: [newIssueTrigger, updatedIssueTrigger],
});
