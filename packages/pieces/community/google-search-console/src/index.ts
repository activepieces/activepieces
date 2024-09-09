import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { urlInspection } from './lib/actions/url-inspection';
import { searchAnalytics } from './lib/actions/search-analytics';
import { listSitemaps } from './lib/actions/list-sitemaps';
import { submitSitemap } from './lib/actions/submit-a-sitemap';
import { listSites } from './lib/actions/list-sites';
import { addSite } from './lib/actions/add-a-site';
import { deleteSite } from './lib/actions/delete-a-site';

// OAuth 2.0 Authentication Configuration
export const googleSearchConsoleAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scope: ['https://www.googleapis.com/auth/webmasters'],
  required: true,
});

export const createAuthClient = (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.webmasters({ version: 'v3', auth });
};

// Create the Google Search Console Piece
export const googleSearchConsolePiece = createPiece({
  displayName: 'Google Search Console',
  minimumSupportedRelease: '0.20.0',
  auth: googleSearchConsoleAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/google-search-console.png',
  authors: ['Gushkool'],
  triggers: [],
  actions: [
    searchAnalytics,
    listSitemaps,
    submitSitemap,
    listSites,
    addSite,
    deleteSite,
    urlInspection,
  ],
});
