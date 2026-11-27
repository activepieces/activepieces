import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { boxAiActions } from './lib/actions/ai';
import { boxAuth } from './lib/auth';
import { boxClient } from './lib/common/client';
import { newCommentTrigger } from './lib/triggers/new-comment';
import { newFileTrigger } from './lib/triggers/new-file';
import { newFolderTrigger } from './lib/triggers/new-folder';

export const box = createPiece({
  displayName: 'Box',
  description: 'Secure content management and collaboration',

  auth: boxAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/box.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    ...boxAiActions,
    createCustomApiCallAction({
      baseUrl: () => boxClient.baseUrl(),
      auth: boxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [newFileTrigger, newFolderTrigger, newCommentTrigger],
});
