import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createIndex } from './lib/actions/create-index';
import { deleteAVector } from './lib/actions/delete-a-vector';
import { getAVector } from './lib/actions/get-a-vector';
import { searchIndex } from './lib/actions/search-index';
import { searchVectors } from './lib/actions/search-vectors';
import { updateAVector } from './lib/actions/update-a-vector';
import { upsertVector } from './lib/actions/upsert-vector';
import { PineconeAuth } from './lib/common/auth';

export const pinecone = createPiece({
  displayName: 'Pinecone',
  auth: PineconeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinecone.png',
  authors: ['Sanket6652'],
  actions: [
    createIndex,
    deleteAVector,
    getAVector,
    searchIndex,
    searchVectors,
    updateAVector,
    upsertVector
  ],
  triggers: [],
});

