import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { bannerbearCreateImageAction } from './lib/actions/create-image';

export const bannerbearAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Bannerbear API Key',
  required: true,
});

export const bannerbear = createPiece({
  displayName: 'Bannerbear',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bannerbear.png',
  authors: ['kanarelo'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: bannerbearAuth,
  actions: [bannerbearCreateImageAction],
  triggers: [],
});
