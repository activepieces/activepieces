import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { confluenceAuth } from './lib/auth';

import { getPageContent } from './lib/actions/get-page-content';
import { createPageFromTemplateAction } from './lib/actions/create-page-from-template';
import { createPageAction } from './lib/actions/create-page';
import { updatePageAction } from './lib/actions/update-page';
import { deletePageAction } from './lib/actions/delete-page';
import { movePageAction } from './lib/actions/move-page';
import { publishDraftAction } from './lib/actions/publish-draft';
import { searchPagesAction } from './lib/actions/search-pages';
import { findPageByTitleAction } from './lib/actions/find-page-by-title';
import { getPageByUrlAction } from './lib/actions/get-page-by-url';
import { addCommentAction } from './lib/actions/add-comment';
import { replyToCommentAction } from './lib/actions/reply-to-comment';
import { listCommentsAction } from './lib/actions/list-comments';
import { uploadAttachmentAction } from './lib/actions/upload-attachment';
import { downloadAttachmentAction } from './lib/actions/download-attachment';
import { listAttachmentsAction } from './lib/actions/list-attachments';
import { addLabelAction } from './lib/actions/add-label';
import { removeLabelAction } from './lib/actions/remove-label';
import { findUserAction } from './lib/actions/find-user';
import { listSpacesAction } from './lib/actions/list-spaces';

import { newPageTrigger } from './lib/triggers/new-page';
import { updatedPageTrigger } from './lib/triggers/updated-page';
import { newCommentTrigger } from './lib/triggers/new-comment';
import { newAttachmentTrigger } from './lib/triggers/new-attachment';
import { newBlogPostTrigger } from './lib/triggers/new-blog-post';

export const confluence = createPiece({
  displayName: 'Confluence',
  auth: confluenceAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/confluence.png',
  authors: ['geekyme', 'sanket-a11y'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  actions: [
    getPageContent,
    getPageByUrlAction,
    findPageByTitleAction,
    searchPagesAction,
    createPageAction,
    createPageFromTemplateAction,
    updatePageAction,
    deletePageAction,
    movePageAction,
    publishDraftAction,
    addCommentAction,
    replyToCommentAction,
    listCommentsAction,
    uploadAttachmentAction,
    downloadAttachmentAction,
    listAttachmentsAction,
    addLabelAction,
    removeLabelAction,
    findUserAction,
    listSpacesAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const domain = auth?.props?.confluenceDomain ?? '';
        return `${domain.replace(/\/+$/, '')}/wiki`;
      },
      auth: confluenceAuth,
      authMapping: async (auth) => {
        const authValue = auth.props;
        return {
          Authorization: `Basic ${Buffer.from(
            `${authValue.username}:${authValue.password}`
          ).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [
    newPageTrigger,
    updatedPageTrigger,
    newCommentTrigger,
    newAttachmentTrigger,
    newBlogPostTrigger,
  ],
});
