import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { newReview } from './lib/triggers/new-review';
import { createReply } from './lib/actions/create-reply';

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
  actions: [createReply],
  triggers: [newReview],
});
