import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createIndex } from './lib/actions/create-index';
import { upsertVector } from './lib/actions/upsert-vector';
import { updateVector } from './lib/actions/update-vector';
import { getVector } from './lib/actions/get-vector';
import { deleteVector } from './lib/actions/delete-vector';
import { searchVector } from './lib/actions/search-vector';
import { searchText } from './lib/actions/search-text';

export const pineconeAuth = PieceAuth.SecretText({
  displayName: 'Pinecone API Key',
  description:
    'Enter your Pinecone API key. You can create a new API key in the Pinecone console for your target project. All requests to Pinecone APIs must contain a valid API key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      // Basic validation to ensure the API key is not empty and has reasonable format
      if (!auth || typeof auth !== 'string') {
        return {
          valid: false,
          error: 'API key is required'
        };
      }

      if (auth.length < 10) {
        return {
          valid: false,
          error:
            'API key appears to be too short. Please check your Pinecone API key.'
        };
      }

      // Additional validation could be added here to test the API key
      // by making a simple API call to Pinecone, but for now we'll keep it simple

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API key format'
      };
    }
  }
});

export const pineconeApi = createPiece({
  displayName: 'Pinecone API',
  auth: pineconeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinecone-api.png',
  authors: ['Pinecone Team'],
  actions: [createIndex, upsertVector, updateVector, getVector, deleteVector, searchVector, searchText],
  triggers: []
});
