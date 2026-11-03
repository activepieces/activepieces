import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { desearchAuth } from './lib/auth';
import { webSearch } from './lib/actions/web-search';

export const desearch = createPiece({
  displayName: 'Desearch',
  description: 'Search the web and retrieve titles, links, and snippets.',
  auth: desearchAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/desearch.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['desearch'],
  actions: [
    webSearch,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.desearch.ai',
      auth: desearchAuth,
      authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
    }),
  ],
  triggers: [],
});
