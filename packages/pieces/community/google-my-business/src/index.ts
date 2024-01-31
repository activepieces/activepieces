import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { newReview } from './lib/triggers/new-review';
import { createReply } from './lib/actions/create-reply';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const googleAuth = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/business.manage'],
});

export const googleBusiness = createPiece({
  auth: googleAuth,
  displayName: 'Google My Business',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-business.png',
  authors: ['abuaboud'],
  actions: [
    createReply,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://www.googleapis.com/business/v4';
      },
      auth: googleAuth,
      authMapping: (auth) => ({
        'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newReview],
});
