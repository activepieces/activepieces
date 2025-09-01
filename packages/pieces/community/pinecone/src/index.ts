import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createIndex } from './lib/actions/create-index';
import { upsertVector } from './lib/actions/upsert-vector';
import { updateVector } from './lib/actions/update-vector';
import { getVector } from './lib/actions/get-vector';
import { deleteVector } from './lib/actions/delete-vector';
import { searchVector } from './lib/actions/search-vector';
import { searchIndex } from './lib/actions/search-index';

export const pineconeAuth = PieceAuth.CustomAuth({
  description: 'Configure your Pinecone API key',
  required: true,
  props: {
    apiKey: Property.LongText({
      displayName: 'API Key',
      description: 'Enter your Pinecone API key. You can create a new API key in the Pinecone console for your target project.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { apiKey } = auth;
      
      if (!apiKey || typeof apiKey !== 'string') {
        return {
          valid: false,
          error: 'API key is required'
        };
      }

      if (apiKey.length < 10) {
        return {
          valid: false,
          error: 'API key appears to be too short. Please check your Pinecone API key.'
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid authentication configuration'
      };
    }
  }
});

export const pinecone = createPiece({
  displayName: 'Pinecone',
  description: 'Manage vector databases, store embeddings, and perform similarity searches',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: pineconeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinecone.png',
  authors: ['fortunamide', 'onyedikachi-david'],
  actions: [createIndex, upsertVector, updateVector, getVector, deleteVector, searchVector, searchIndex],
  triggers: []
});
