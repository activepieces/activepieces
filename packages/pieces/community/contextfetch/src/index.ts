import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getContentsAction } from './lib/actions/get-contents';
import { searchAction } from './lib/actions/search';
import { contextfetchAuth } from './lib/auth';
import { BASE_URL } from './lib/common/client';

export const contextfetch = createPiece({
  displayName: 'ContextFetch',
  description: 'Web search and page contents API for AI agents.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/contextfetch.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['lachy3433'],
  auth: contextfetchAuth,
  actions: [
    searchAction,
    getContentsAction,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: contextfetchAuth,
      authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
    }),
  ],
  triggers: [],
});
