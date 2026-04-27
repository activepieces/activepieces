import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { cannyAuth } from './lib/auth';
import { createPostAction } from './lib/actions/create-post';
import { retrievePostAction } from './lib/actions/retrieve-post';
import { listPostsAction } from './lib/actions/list-posts';
import { createVoteAction } from './lib/actions/create-vote';
import { deleteVoteAction } from './lib/actions/delete-vote';
import { newPostTrigger } from './lib/triggers/new-post';
import { postStatusChangedTrigger } from './lib/triggers/post-status-changed';
import { newCommentTrigger } from './lib/triggers/new-comment';
import { newVoteTrigger } from './lib/triggers/new-vote';

export const canny = createPiece({
  displayName: 'Canny',
  description:
    'Product feedback management platform. Collect, organize, and prioritize feature requests from your users.',
  auth: cannyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canny.png',
  authors: ['Harmatta', 'sanket-a11y'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createPostAction,
    retrievePostAction,
    listPostsAction,
    createVoteAction,
    deleteVoteAction,
    // createCustomApiCallAction({
    //   baseUrl: () => CANNY_API_BASE,
    //   auth: cannyAuth,
    //   authMapping: async (_auth) => ({
    //     'Content-Type': 'application/json',
    //   }),
    // }),
  ],
  triggers: [newPostTrigger, postStatusChangedTrigger, newCommentTrigger, newVoteTrigger],
});
