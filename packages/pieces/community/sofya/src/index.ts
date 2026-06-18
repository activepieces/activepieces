import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { searchAction } from './lib/actions/search';
import { fetchAction } from './lib/actions/fetch';
import { extractAction } from './lib/actions/extract';
import { researchAction } from './lib/actions/research';
import { sofyaAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';

export const sofya = createPiece({
  displayName: 'Sofya',
  description:
    'Web tools for AI agents: search the web, fetch pages as clean markdown, extract structured data with AI, and run deep multi-source research.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sofya.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['yusufgurdogan'],
  auth: sofyaAuth,
  actions: [
    searchAction,
    fetchAction,
    extractAction,
    researchAction,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: sofyaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
