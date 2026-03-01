import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createReply } from './lib/actions/create-reply';
import { newReview } from './lib/triggers/new-review';

export const googleAuth = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/business.manage'],
});

export const googleBusiness = createPiece({
  auth: googleAuth,
  displayName: 'Google My Business',
  description: 'Manage your business on Google',

  logoUrl: 'https://cdn.activepieces.com/pieces/google-business.png',
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.MARKETING],
  actions: [
    createReply,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://www.googleapis.com/business/v4';
      },
      auth: googleAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newReview],
});
