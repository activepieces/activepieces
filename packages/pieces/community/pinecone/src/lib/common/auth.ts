import { PieceAuth } from '@activepieces/pieces-framework';

export const pineconeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Pinecone API key from the console',
  required: true,
});

export type PineconeAuth = string; 