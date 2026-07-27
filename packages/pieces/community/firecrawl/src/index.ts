import { createCustomApiCallAction} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { scrape } from './lib/actions/scrape';
import { extract } from './lib/actions/extract';
import { crawl } from './lib/actions/crawl';
import { crawlResults } from './lib/actions/crawl-results';
import { map } from './lib/actions/map';
import { FIRECRAWL_API_BASE_URL } from './lib/common/common';
import { firecrawlAuth } from './lib/auth';


export const firecrawl = createPiece({
  displayName: 'Firecrawl',
  description: 'Extract structured data from websites using AI with natural language prompts',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/firecrawl.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["geekyme-fsmk", "geekyme", "arinmakk"],
  auth: firecrawlAuth,
  actions: [
    scrape,
    extract,
    crawl,
    crawlResults,
    map,

    createCustomApiCallAction({
      baseUrl: () => FIRECRAWL_API_BASE_URL,
      auth: firecrawlAuth,
      authMapping: async (auth) => ({
        'Authorization': `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});