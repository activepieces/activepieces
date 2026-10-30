import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createIndexAction } from './lib/actions/create-index';
import { upsertVectorAction } from './lib/actions/upsert-vector';
import { updateVectorAction } from './lib/actions/update-vector';
import { getVectorAction } from './lib/actions/get-vector';
import { deleteVectorAction } from './lib/actions/delete-vector';
import { searchVectorAction } from './lib/actions/search-vector';
import { searchIndexAction } from './lib/actions/search-index';
import { pineconeAiActions } from './lib/actions/ai';
import { pineconeAuth } from './lib/auth';
import { pineconeClient } from './lib/common/client';

export const pinecone = createPiece({
  displayName: 'Pinecone',
  description: 'Manage vector databases, store embeddings, and perform similarity searches',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: pineconeAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinecone.png',
  authors: ['fortunamide', 'onyedikachi-david'],
  actions: [
    createIndexAction,
    upsertVectorAction,
    updateVectorAction,
    getVectorAction,
    deleteVectorAction,
    searchVectorAction,
    searchIndexAction,
    ...pineconeAiActions,
    createCustomApiCallAction({
      auth: pineconeAuth,
      baseUrl: () => pineconeClient.baseUrl(),
      authMapping: async (auth) => ({
        'Api-Key': auth.props.apiKey,
        'X-Pinecone-Api-Version': pineconeClient.apiVersion(),
      }),
    }),
  ],
  triggers: []
});
