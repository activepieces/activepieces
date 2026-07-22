import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { scrape } from './lib/actions/scrape';
import { extract } from './lib/actions/extract';
import { crawl } from './lib/actions/crawl';
import { crawlResults } from './lib/actions/crawl-results';
import { map } from './lib/actions/map';
import { scrapeUrl } from './lib/actions/scrape-url';
import { crawlWebsite } from './lib/actions/crawl-website';
import { getCrawlResults } from './lib/actions/get-crawl-results';
import { mapWebsite } from './lib/actions/map-website';
import { extractData } from './lib/actions/extract-data';
import { batchScrape } from './lib/actions/batch-scrape';
import { getBatchScrapeResults } from './lib/actions/get-batch-scrape-results';
import { getBatchScrapeErrors } from './lib/actions/get-batch-scrape-errors';
import { cancelBatchScrape } from './lib/actions/cancel-batch-scrape';
import { getCrawlErrors } from './lib/actions/get-crawl-errors';
import { cancelCrawl } from './lib/actions/cancel-crawl';
import { listActiveCrawls } from './lib/actions/list-active-crawls';
import { searchWeb } from './lib/actions/search-web';
import { startAgent } from './lib/actions/start-agent';
import { getAgentStatus } from './lib/actions/get-agent-status';
import { FIRECRAWL_API_BASE_URL } from './lib/common/common';
import { firecrawlAuth } from './lib/auth';

const markdownDescription = `
Follow these steps to obtain your Firecrawl API Key:

1. Visit [Firecrawl](https://firecrawl.dev) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the API settings section.
`;

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

    // audience:'ai' agent atomics (twins + net-new)
    scrapeUrl,
    crawlWebsite,
    getCrawlResults,
    mapWebsite,
    extractData,
    batchScrape,
    getBatchScrapeResults,
    getBatchScrapeErrors,
    cancelBatchScrape,
    getCrawlErrors,
    cancelCrawl,
    listActiveCrawls,
    searchWeb,
    startAgent,
    getAgentStatus,

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