import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createBeamerPost } from './lib/actions/create-posts';
import { createNewFeatureRequest } from './lib/actions/create-feature-request';
import { createComment } from './lib/actions/create-comment';
import { newPost } from './lib/trigger/new-post';
import { createVote } from './lib/actions/create-vote';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { beamerCommon } from './lib/common';

export const beamerAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Beamer settings',
});

export const beamer = createPiece({
  displayName: 'beamer',
  logoUrl: 'https://cdn.activepieces.com/pieces/beamer.png',
  auth: beamerAuth,
  authors: ['i-nithin'],
  actions: [
    createBeamerPost,
    createNewFeatureRequest,
    createComment,
    createVote,
    createCustomApiCallAction({
      baseUrl: () => beamerCommon.baseUrl,
      auth: beamerAuth,
      authMapping: (auth) => ({
        'Beamer-Api-Key': `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newPost],
});
