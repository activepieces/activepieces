import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { urlInspection } from './lib/actions/url-inspection';
import { searchAnalytics } from './lib/actions/search-analytics';
import { listSitemaps } from './lib/actions/list-sitemaps';
import { submitSitemap } from './lib/actions/submit-a-sitemap';
import { listSites } from './lib/actions/list-sites';
import { addSite } from './lib/actions/add-a-site';
import { deleteSite } from './lib/actions/delete-a-site';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { googleSearchConsoleAuth } from './lib/auth';

export const createAuthClient = (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.webmasters({ version: 'v3', auth });
};

export const googleSearchConsolePiece = createPiece({
  displayName: 'Google Search Console',
  minimumSupportedRelease: '0.30.0',
  auth: googleSearchConsoleAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/google-search-console.png',
  authors: ['Gushkool','kishanprmr'],
  triggers: [],
  actions: [
    searchAnalytics,
    listSitemaps,
    submitSitemap,
    listSites,
    addSite,
    deleteSite,
    urlInspection,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.googleapis.com/webmasters/v3',
      auth: googleSearchConsoleAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth).access_token}`,
      }),
    }),
  ],
});
//TODO : remove this comment, add Gushkool's email to local git configuration
