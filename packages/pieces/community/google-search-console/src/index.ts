import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addSite } from './lib/actions/add-a-site';
import { deleteSiteBySiteUrl } from './lib/actions/ai/delete-site-by-site-url';
import { deleteSitemapBySiteUrl } from './lib/actions/ai/delete-sitemap-by-site-url';
import { getSite } from './lib/actions/ai/get-site';
import { getSitemap } from './lib/actions/ai/get-sitemap';
import { inspectUrlBySiteUrl } from './lib/actions/ai/inspect-url-by-site-url';
import { listSitemapsBySiteUrl } from './lib/actions/ai/list-sitemaps-by-site-url';
import { searchAnalyticsBySiteUrl } from './lib/actions/ai/search-analytics-by-site-url';
import { submitSitemapBySiteUrl } from './lib/actions/ai/submit-sitemap-by-site-url';
import { deleteSite } from './lib/actions/delete-a-site';
import { deleteSitemap } from './lib/actions/delete-a-sitemap';
import { listSitemaps } from './lib/actions/list-sitemaps';
import { listSites } from './lib/actions/list-sites';
import { searchAnalytics } from './lib/actions/search-analytics';
import { submitSitemap } from './lib/actions/submit-a-sitemap';
import { urlInspection } from './lib/actions/url-inspection';
import { googleSearchConsoleAuth } from './lib/auth';

export const googleSearchConsolePiece = createPiece({
  displayName: 'Google Search Console',
  description: "Monitor your site's Google Search traffic, sitemaps and index status.",
  minimumSupportedRelease: '0.88.2',
  auth: googleSearchConsoleAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/google-search-console.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Gushkool', 'kishanprmr', 'itsishant', 'sanket-a11y'],
  triggers: [],
  actions: [
    searchAnalytics,
    searchAnalyticsBySiteUrl,
    listSitemaps,
    listSitemapsBySiteUrl,
    getSitemap,
    submitSitemap,
    submitSitemapBySiteUrl,
    deleteSitemap,
    deleteSitemapBySiteUrl,
    listSites,
    getSite,
    addSite,
    deleteSite,
    deleteSiteBySiteUrl,
    urlInspection,
    inspectUrlBySiteUrl,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.googleapis.com/webmasters/v3',
      auth: googleSearchConsoleAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
});
