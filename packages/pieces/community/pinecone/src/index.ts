import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const pinecone = createPiece({
  displayName: 'Pinecone',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinecone.png',
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});

