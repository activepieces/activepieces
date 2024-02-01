import { createCustomApiCallAction } from '@activepieces/pieces-common';
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
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['kanarelo'],
  auth: bannerbearAuth,
  actions: [
    bannerbearCreateImageAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://sync.api.bannerbear.com/v2',
      auth: bannerbearAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
