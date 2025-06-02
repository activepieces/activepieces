import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const chatbaseAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Chatbase API key',
      required: true,
    })
  }
});

export const chatbase = createPiece({
  displayName: 'Chatbase',
  auth: chatbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chatbase.png',
  authors: [],
  actions: [],
  triggers: [],
});
