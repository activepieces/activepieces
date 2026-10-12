import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BULKPUBLISH_BASE_URL, bulkpublishAuth } from './lib/common';
import { createPost } from './lib/actions/create-post';
import { uploadMedia } from './lib/actions/upload-media';
import { updatePost } from './lib/actions/update-post';
import { deletePost } from './lib/actions/delete-post';
import { retryPost } from './lib/actions/retry-post';
import { listChannels } from './lib/actions/list-channels';
import { getPost } from './lib/actions/get-post';
import { newPublishedPost, postFailed, newScheduledPost } from './lib/triggers';

export const bulkpublish = createPiece({
  displayName: 'BulkPublish',
  description: 'Schedule and publish social media posts to 16 platforms from one place.',
  auth: bulkpublishAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://www.bulkpublish.com/assets/logo.svg',
  categories: [PieceCategory.MARKETING],
  authors: ['azeemkafridi'],
  actions: [
    createPost,
    uploadMedia,
    updatePost,
    deletePost,
    retryPost,
    listChannels,
    getPost,
    createCustomApiCallAction({
      baseUrl: () => BULKPUBLISH_BASE_URL,
      auth: bulkpublishAuth,
      authMapping: async (auth) => ({ Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}` }),
    }),
  ],
  triggers: [newPublishedPost, postFailed, newScheduledPost],
});
