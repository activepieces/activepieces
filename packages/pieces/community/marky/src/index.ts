import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { createFileAction } from './lib/actions/create-file';
import { createPostAction } from './lib/actions/create-post';
import { createTopicAction } from './lib/actions/create-topic';
import { deleteTopicAction } from './lib/actions/delete-topic';
import { getPostAction } from './lib/actions/get-post';
import { listPostsAction } from './lib/actions/list-posts';
import { schedulePostAction } from './lib/actions/schedule-post';
import { updatePostAction } from './lib/actions/update-post';
import { updateTopicAction } from './lib/actions/update-topic';
import { uploadMediaAction } from './lib/actions/upload-media';
import { markyAuth } from './lib/auth';
import { MARKY_API_VERSION, MARKY_BASE_URL } from './lib/common/client';
import { postPublishedTrigger } from './lib/triggers/post-published';

export const marky = createPiece({
  displayName: 'Marky',
  description: 'AI-powered social media content generation, scheduling and publishing.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/marky.png',
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  auth: markyAuth,
  authors: ['bst1n'],
  actions: [
    createPostAction,
    updatePostAction,
    schedulePostAction,
    listPostsAction,
    getPostAction,
    uploadMediaAction,
    createTopicAction,
    updateTopicAction,
    deleteTopicAction,
    createFileAction,
    createCustomApiCallAction({
      baseUrl: () => MARKY_BASE_URL,
      auth: markyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
        'Marky-Version': MARKY_API_VERSION,
      }),
    }),
  ],
  triggers: [postPublishedTrigger],
});
