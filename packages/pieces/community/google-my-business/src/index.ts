import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createPost } from './lib/actions/create-post';
import { createReply } from './lib/actions/create-reply';
import { deletePost } from './lib/actions/delete-post';
import { getPost } from './lib/actions/get-post';
import { listPosts } from './lib/actions/list-posts';
import { updatePost } from './lib/actions/update-post';
import { deleteReviewReply } from './lib/actions/delete-review-reply';
import { getLocation } from './lib/actions/get-location';
import { getLocationVerificationState } from './lib/actions/get-location-verification-state';
import { getMedia } from './lib/actions/get-media';
import { getReview } from './lib/actions/get-review';
import { listAccounts } from './lib/actions/list-accounts';
import { listLocations } from './lib/actions/list-locations';
import { listMedia } from './lib/actions/list-media';
import { listReviews } from './lib/actions/list-reviews';
import { replyToReview } from './lib/actions/reply-to-review';
import { updateLocation } from './lib/actions/update-location';
import { newReview } from './lib/triggers/new-review';

export const googleAuth = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/business.manage', 'email'],
});

export const googleBusiness = createPiece({
  auth: googleAuth,
  displayName: 'Google My Business',
  description: 'Manage your business on Google',

  logoUrl: 'https://cdn.activepieces.com/pieces/google-business.png',
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.MARKETING],
  minimumSupportedRelease: '0.88.2',
  actions: [
    createPost,
    listPosts,
    getPost,
    updatePost,
    deletePost,
    createReply,
    listAccounts,
    listLocations,
    getLocation,
    updateLocation,
    listReviews,
    getLocationVerificationState,
    listMedia,
    getMedia,
    getReview,
    replyToReview,
    deleteReviewReply,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://mybusiness.googleapis.com/v4';
      },
      auth: googleAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newReview],
});
