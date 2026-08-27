import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { mrscraperAuth } from './lib/auth';
import { getAccountInfo } from './lib/actions/get-account-info';
import { crawlWebsiteUrls } from './lib/actions/crawl-website-urls';
import { searchGoogleSerp } from './lib/actions/search-google-serp';
import { extractPageByPrompt } from './lib/actions/extract-page-by-prompt';
import { extractListings } from './lib/actions/extract-listings';
import { extractStructuredData } from './lib/actions/extract-structured-data';
import { fetchRenderedHtml } from './lib/actions/fetch-rendered-html';
import { getResults } from './lib/actions/get-results';
import { getLatestResults } from './lib/actions/get-latest-results';
import { getResultDetail } from './lib/actions/get-result-detail';
import { createPromptScraper } from './lib/actions/create-prompt-scraper';
import { createListingScraper } from './lib/actions/create-listing-scraper';
import { createWebsiteCrawlScraper } from './lib/actions/create-website-crawl-scraper';
import { runExistingScraper } from './lib/actions/run-existing-scraper';
import { runExistingScraperBatch } from './lib/actions/run-existing-scraper-batch';

export const mrscraper = createPiece({
  displayName: 'MrScraper',
  description:
    'Discover URLs, search Google, extract web data, and run AI or manual scrapers.',
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mrscraper.svg',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: mrscraperAuth,
  authors: ['mrscraper10'],
  actions: [
    getAccountInfo,
    crawlWebsiteUrls,
    searchGoogleSerp,
    extractPageByPrompt,
    extractListings,
    extractStructuredData,
    fetchRenderedHtml,
    getResults,
    getLatestResults,
    getResultDetail,
    createPromptScraper,
    createListingScraper,
    createWebsiteCrawlScraper,
    runExistingScraper,
    runExistingScraperBatch,
  ],
  triggers: [],
});
