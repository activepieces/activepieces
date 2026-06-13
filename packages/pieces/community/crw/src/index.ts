import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { scrape } from './lib/actions/scrape';
import { extract } from './lib/actions/extract';
import { crawl } from './lib/actions/crawl';
import { crawlResults } from './lib/actions/crawl-results';
import { map } from './lib/actions/map';
import { search } from './lib/actions/search';
import { CRW_API_BASE_URL } from './lib/common/common';
import { crwAuth } from './lib/auth';

const markdownDescription = `
Follow these steps to obtain your fastCRW API Key:

1. Visit [fastCRW](https://fastcrw.com) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the API settings section.
`;

export const crw = createPiece({
  displayName: 'fastCRW',
  description: 'Firecrawl-compatible web scraper (single binary; self-host or cloud) to scrape, crawl, map, search, and extract structured data from websites',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/crw.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["fastcrw"],
  auth: crwAuth,
  actions: [
    scrape,
    extract,
    crawl,
    crawlResults,
    map,
    search,

    createCustomApiCallAction({
      baseUrl: () => CRW_API_BASE_URL,
      auth: crwAuth,
      authMapping: async (auth) => ({
        'Authorization': `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
