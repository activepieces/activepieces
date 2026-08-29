import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { crawlWebsite } from './lib/actions/crawl-website';
import { extractStructuredData } from './lib/actions/extract-structured-data';
import { findWebsitePages } from './lib/actions/find-website-pages';
import { getBrandProfile } from './lib/actions/get-brand-profile';
import { scrapeUrl } from './lib/actions/scrape-url';
import { searchWeb } from './lib/actions/search-web';
import { contextDevAuth } from './lib/auth';
import { CONTEXT_API_BASE_URL } from './lib/common/client';

export const contextDev = createPiece({
  displayName: 'Context.dev',
  description:
    'Live web search, scraping, crawling, structured extraction, and brand intelligence.',
  auth: contextDevAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://www.context.dev/logo.png',
  authors: ['aadithyanr'],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.PRODUCTIVITY,
  ],
  actions: [
    searchWeb,
    scrapeUrl,
    crawlWebsite,
    findWebsitePages,
    extractStructuredData,
    getBrandProfile,
    createCustomApiCallAction({
      auth: contextDevAuth,
      baseUrl: () => CONTEXT_API_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
