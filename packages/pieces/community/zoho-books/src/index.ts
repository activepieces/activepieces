import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { zohoBooksAuth } from './lib/auth';
import { zohoBooksClient } from './lib/common/client';

export const zohoBooks = createPiece({
  displayName: "Zoho Books",
  description: 'Comprehensive online accounting software for small businesses.',
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-books.png",
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.ACCOUNTING],
  authors: ["ikus060"],
  auth: zohoBooksAuth,
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? zohoBooksClient.baseUrl({ auth }) : ''),
      auth: zohoBooksAuth,
      authMapping: async (auth) => zohoBooksClient.authHeaders({ auth }),
    }),
  ],
  triggers: [],
});
