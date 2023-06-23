import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { bannerbearCreateImageAction } from './lib/actions/create-image';

export const bannerbearAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Bannerbear API Key',
  required: true,
});

export const bannerbear = createPiece({
  displayName: "Bannerbear",
  logoUrl: 'https://cdn.activepieces.com/pieces/bannerbear.png',
  authors: ["kanarelo"],
  auth: bannerbearAuth,
  actions: [
    bannerbearCreateImageAction,
  ],
  triggers: [
  ],
});
