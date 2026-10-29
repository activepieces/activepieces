import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addCommentReactionAction, listCommentReactionsAction, removeCommentReactionAction } from './lib/actions/comment-reactions';
import { deleteCommentAction } from './lib/actions/delete-comment';
import { exportNodeImagesAction } from './lib/actions/export-node-images';
import { getCommentsAction } from './lib/actions/get-comments';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { getFileAction } from './lib/actions/get-file';
import { getFileMetadataAction } from './lib/actions/get-file-metadata';
import { getFileNodesAction } from './lib/actions/get-file-nodes';
import { getFileOutlineAction } from './lib/actions/get-file-outline';
import { listFileComponentsAction, listFileStylesAction } from './lib/actions/library-content';
import { listFileVersionsAction } from './lib/actions/list-file-versions';
import { postCommentAction } from './lib/actions/post-comment';
import { figmaAuth } from './lib/auth';
import { figmaClient } from './lib/common/client';
import { fileDeletedTrigger, fileUpdatedTrigger, libraryPublishedTrigger, newCommentTrigger, newFileVersionTrigger } from './lib/triggers/figma-triggers';

export const figma = createPiece({
  displayName: 'Figma',
  description: 'Collaborative interface design tool',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/figma.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'OdaiAhmed99'],
  auth: figmaAuth,
  actions: [
    getFileAction,
    getFileOutlineAction,
    getFileMetadataAction,
    getFileNodesAction,
    exportNodeImagesAction,
    listFileVersionsAction,
    getCommentsAction,
    postCommentAction,
    deleteCommentAction,
    listCommentReactionsAction,
    addCommentReactionAction,
    removeCommentReactionAction,
    listFileComponentsAction,
    listFileStylesAction,
    getCurrentUserAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.figma.com',
      auth: figmaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${tokenOf(auth)}`,
      }),
    }),
  ],
  triggers: [newCommentTrigger, newFileVersionTrigger, fileUpdatedTrigger, libraryPublishedTrigger, fileDeletedTrigger],
});

function tokenOf(auth: unknown): string {
  const token = figmaClient.isRecord(auth) ? auth['access_token'] : undefined;
  return typeof token === 'string' ? token : '';
}
