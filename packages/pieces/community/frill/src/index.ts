import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

import { frillAuth } from './lib/auth';

export { frillAuth };

import { createIdea } from './lib/actions/create-idea';
import { updateIdea } from './lib/actions/update-idea';
import { createComment } from './lib/actions/create-comment';
import { createAnnouncement } from './lib/actions/create-announcement';
import { createFollower } from './lib/actions/create-follower';
import { updateFollower } from './lib/actions/update-follower';
import { getIdeas } from './lib/actions/get-ideas';
import { getComments } from './lib/actions/get-comments';

import { newIdeaTrigger } from './lib/triggers/new-idea';
import { newCommentTrigger } from './lib/triggers/new-comment';

export const frill = createPiece({
  displayName: 'Frill',
  description: 'Collect feedback, manage ideas, and publish announcements with Frill.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'frill.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: frillAuth,
  authors: ['simonmann2'],
  actions: [
    createIdea,
    updateIdea,
    createComment,
    createAnnouncement,
    createFollower,
    updateFollower,
    getIdeas,
    getComments,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.frill.co/v1',
      auth: frillAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newIdeaTrigger, newCommentTrigger],
});
