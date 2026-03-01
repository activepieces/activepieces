import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getFullList } from './lib/actions/get-full-list';

export const gelatoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});


export const pocketbase = createPiece({
  displayName: 'Pocketbase',
  description: '',
  auth: gelatoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pocketbase.png',
  authors: [],
  actions: [getFullList],
  triggers: [],
});
