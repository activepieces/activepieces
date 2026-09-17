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
  actions: [
    createPost,
    listPosts,
    getPost,
    updatePost,
    deletePost,
    createReply,
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
