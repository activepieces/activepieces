import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCommentAction } from './lib/actions/create-comment';
import { createFeatureRequestAction } from './lib/actions/create-feature-request';
import { createPostAction } from './lib/actions/create-post';
import { createVoteAction } from './lib/actions/create-vote';
import { beamerClient } from './lib/common/client';
import { newPostTrigger } from './lib/triggers/new-post';
import { beamerAuth } from './lib/auth';

export const beamer = createPiece({
  displayName: 'Beamer',
  description: 'Engage users with targeted announcements',
  logoUrl: 'https://cdn.activepieces.com/pieces/beamer.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: beamerAuth,
  authors: ["i-nithin","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createPostAction,
    createFeatureRequestAction,
    createCommentAction,
    createVoteAction,
    createCustomApiCallAction({
      baseUrl: () => beamerClient.baseUrl(),
      auth: beamerAuth,
      authMapping: async (auth) => ({
        'Beamer-Api-Key': `${auth}`,
      }),
    }),
  ],
  triggers: [newPostTrigger],
});
