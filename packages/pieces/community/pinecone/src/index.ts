import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createIndex } from './lib/actions/create-index';
import { upsertVector } from './lib/actions/upsert-vector';
import { updateVector } from './lib/actions/update-vector';
import { getVector } from './lib/actions/get-vector';
import { deleteVector } from './lib/actions/delete-vector';
import { searchVector } from './lib/actions/search-vector';
import { searchIndex } from './lib/actions/search-index';
import { pineconeAuth } from './lib/auth';

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
