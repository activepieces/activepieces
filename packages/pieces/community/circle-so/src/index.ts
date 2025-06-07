import { createPiece } from '@activepieces/pieces-framework';
import { circleSoAuth } from './lib/common';
import { newPostCreated } from './lib/triggers/new-post';
import { newCommentPosted } from './lib/triggers/new-comment-posted';
import { newMemberAdded } from './lib/triggers/new-member-added';
import { createPost } from './lib/actions/create-post';
import { createComment } from './lib/actions/create-comment';
import { addMemberToSpace } from './lib/actions/add-member-to-space';
import { findMemberByEmail } from './lib/actions/find-member-by-email';
import { getPostDetails } from './lib/actions/get-post-details';
import { getMemberDetails } from './lib/actions/get-member-details';

export const circleSo = createPiece({
  displayName: 'Circle.so',
  logoUrl: 'https://cdn.activepieces.com/pieces/circle-so.png',
  description: 'Circle.so is a platform for creating and managing communities.',
  auth: circleSoAuth,
  minimumSupportedRelease: '0.36.1',
  authors: ['onyedikachi-david'],
  actions: [
    createPost,
    createComment,
    addMemberToSpace,
    findMemberByEmail,
    getPostDetails,
    getMemberDetails
  ],
  triggers: [
    newPostCreated,
    newCommentPosted,
    newMemberAdded
  ],
});
