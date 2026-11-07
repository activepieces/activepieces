import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { addPointsToCollection } from './lib/actions/add-points';
import { qdrantAiActions } from './lib/actions/ai';
import { deleteCollection } from './lib/actions/delete-collection';
import { deletePoints } from './lib/actions/delete-points';
import { collectionInfos } from './lib/actions/get-collection-infos';
import { collectionList } from './lib/actions/get-collection-list';
import { getPoints } from './lib/actions/get-points';
import { searchPoints } from './lib/actions/search-points';
import { qdrantAuth } from './lib/auth';
import { qdrantClient } from './lib/common/client';

export const qdrant = createPiece({
  displayName: 'Qdrant',
  description: 'Make any action on your qdrant vector database',
  auth: qdrantAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/qdrant.png',
  authors: ["ArmanGiau3","kishanprmr","abuaboud"],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [
    addPointsToCollection,
    collectionList,
    collectionInfos,
    deleteCollection,
    deletePoints,
    getPoints,
    searchPoints,
    ...qdrantAiActions,
    createCustomApiCallAction({
      auth: qdrantAuth,
      baseUrl: (auth) => (auth ? qdrantClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => ({ 'api-key': auth.props.key }),
    }),
  ],
  triggers: [],
});
