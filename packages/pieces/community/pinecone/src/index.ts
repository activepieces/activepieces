import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createIndexAction } from './lib/actions/create-index';
import { upsertVectorAction } from './lib/actions/upsert-vector';
import { getVectorAction } from './lib/actions/get-vector';
import { updateVectorAction } from './lib/actions/update-vector';
import { deleteVectorAction } from './lib/actions/delete-vector';
import { searchVectorsAction } from './lib/actions/search-vectors';
import { searchIndexAction } from './lib/actions/search-index';
import { pineconeAuth } from './lib/common/auth';

export const pinecone = createPiece({
  displayName: 'Pinecone',
  description: 'Vector database for machine learning applications',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinecone.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS],
  auth: pineconeAuth,
  actions: [
    createIndexAction,
    upsertVectorAction,
    getVectorAction,
    updateVectorAction,
    deleteVectorAction,
    searchVectorsAction,
    searchIndexAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pinecone.io',
      auth: pineconeAuth,
      authMapping: async (auth) => ({
        'Api-Key': auth as string,
      }),
    }),
  ],
  authors: ['saheli-saha'],
  triggers: [],
});