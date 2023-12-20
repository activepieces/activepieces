import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createBeamerPost } from './lib/actions/create-posts';
import { createNewFeatureRequest } from './lib/actions/create-feature-request';
import { createComment } from './lib/actions/create-comment';
import { newPost } from './lib/trigger/new-post';
import { createVote } from './lib/actions/create-vote';

export const beamerAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Beamer settings',
});

export const beamer = createPiece({
  displayName: 'beamer',
  logoUrl: 'https://i.ibb.co/S6krpZZ/beamer.jpg',
  auth: beamerAuth,
  authors: ['Nithin Kumar'],
  actions: [
    createBeamerPost,
    createNewFeatureRequest,
    createComment,
    createVote,
  ],
  triggers: [newPost],
});
