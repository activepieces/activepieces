import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getIcecreamFlavor } from './lib/actions/get-icecream-flavor';
import { newFlavorCreated } from './lib/triggers/new-flavor-created';

export const gelatoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});

export const gelato = createPiece({
  displayName: 'Gelato',
  logoUrl: 'https://cdn.activepieces.com/pieces/gelato.png',
  auth: gelatoAuth,
  authors: [],
  actions: [
    getIcecreamFlavor,
    createCustomApiCallAction({
      baseUrl: () => 'https://gelato.activepieces.com/api',
      auth: gelatoAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newFlavorCreated],
});
