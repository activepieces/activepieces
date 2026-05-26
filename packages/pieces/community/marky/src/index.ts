import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

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
import { postPublishedTrigger } from './lib/triggers/post-published';

const marky = createPiece({
  displayName: 'Marky',
  description: 'AI-powered social media content scheduling and management.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/marky.png',
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  authors: [],
  auth: markyAuth,
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
      auth: markyAuth,
      baseUrl: () => 'https://api.mymarky.ai/api',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    }),
  ],
  triggers: [postPublishedTrigger],
});

export { marky };
