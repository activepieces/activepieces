import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { newFlavorCreated } from './lib/triggers/new-flavour-created';

export const gelatoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});

export const gelato = createPiece({
  displayName: 'Gelato Tutorial',
  logoUrl: 'https://cdn.activepieces.com/pieces/gelato.png',
  authors: [],
  auth: gelatoAuth,
  actions: [],
  // Add the trigger here.
  triggers: [newFlavorCreated], // <--------
});
