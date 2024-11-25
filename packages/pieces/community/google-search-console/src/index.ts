import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { urlInspection } from './lib/actions/url-inspection';
import { searchAnalytics } from './lib/actions/search-analytics';
import { listSitemaps } from './lib/actions/list-sitemaps';
import { submitSitemap } from './lib/actions/submit-a-sitemap';
import { listSites } from './lib/actions/list-sites';
import { addSite } from './lib/actions/add-a-site';
import { deleteSite } from './lib/actions/delete-a-site';

export const googleSearchConsoleAuth = PieceAuth.OAuth2({
  description: `
  1. Sign in to [Google Cloud Console](https://console.cloud.google.com/).
  2. Create a new project or you can use existing one.
  3. Go to **APIs & Services** and click **Enable APIs & Services**.
  4. Search for **Google Search Console API** in the search bar and enable it.
  5. Go to **OAuth consent screen** and select **External** type and click create.
  6. Fill App Name, User Support Email, and Developer Contact Information. Click on the Save and Continue button.
  7. Click on **Add or Remove Scopes** and add following scopes and click update.
     - https://www.googleapis.com/auth/webmasters
  8. Click Save and Continue to finish the Scopes step.
  9. Click on the Add Users button and add a test email You can add your own email).Then finally click Save and Continue to finish the Test Users portion.
  10. Go to **Credentials**. Click on the **Create Credentials** button and select the **OAuth client ID** option.
  11. Select the application type as **Web Application** and fill the Name field.
  12. Add https://cloud.activepieces.com/redirect in **Authorized redirect URIs** field, and click on the Create button.
  13. Copy **Client ID** and **Client Secret**.`,
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

export const googleSearchConsolePiece = createPiece({
  displayName: 'Google Search Console',
  minimumSupportedRelease: '0.30.0',
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
//TODO : remove this comment, add Gushkool's email to local git configuration
