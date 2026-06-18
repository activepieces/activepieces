import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { olostepAuth } from './lib/auth';
import { scrapeUrl } from './lib/actions/scrape-url';
import { searchWeb } from './lib/actions/search-web';

export const olostep = createPiece({
  displayName: 'Olostep',
  description: 'Search the web and scrape pages with Olostep',
  auth: olostepAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/olostep.png',
  authors: [],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    searchWeb,
    scrapeUrl,
    createCustomApiCallAction({
      auth: olostepAuth,
      baseUrl: () => {
        return 'https://api.olostep.com/v1';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
