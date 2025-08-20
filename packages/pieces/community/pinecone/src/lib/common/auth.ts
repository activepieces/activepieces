import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const pineconeAuth = PieceAuth.CustomAuth({
  description: 'Enter your Pinecone API key and project ID from the console',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Pinecone API key from the console',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your Pinecone project ID from the console',
      required: true,
    }),
  },
});

export type PineconeAuth = {
  apiKey: string;
  projectId: string;
}; 