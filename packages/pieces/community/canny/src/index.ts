import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { cannyAuth } from './lib/auth';
import { CANNY_API_BASE } from './lib/common/client';
import { createPostAction } from './lib/actions/create-post';
import { retrievePostAction } from './lib/actions/retrieve-post';
import { listPostsAction } from './lib/actions/list-posts';
import { createVoteAction } from './lib/actions/create-vote';
import { deleteVoteAction } from './lib/actions/delete-vote';

export const canny = createPiece({
  displayName: 'Canny',
  description:
    'Product feedback management platform. Collect, organize, and prioritize feature requests from your users.',
  auth: cannyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canny.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createPostAction,
    retrievePostAction,
    listPostsAction,
    createVoteAction,
    deleteVoteAction,
    createCustomApiCallAction({
      baseUrl: () => CANNY_API_BASE,
      auth: cannyAuth,
      authMapping: async (_auth) => ({
        'Content-Type': 'application/json',
      }),
      description:
        'Send a custom request to the Canny API. Note: all Canny endpoints use POST method and require the apiKey in the JSON body.',
    }),
  ],
  triggers: [],
});
