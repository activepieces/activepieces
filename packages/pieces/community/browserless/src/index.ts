import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { captureScreenshot } from './lib/actions/capture-screenshot';
import { generatePdf } from './lib/actions/generate-pdf';
import { getWebsitePerformance } from './lib/actions/get-website-performance';
import { runBqlQuery } from './lib/actions/run-bql-query';
import { scrapeUrl } from './lib/actions/scrape-url';
import { browserlessAuth, browserlessCommon } from './lib/common';

export const browserless = createPiece({
  displayName: 'Browserless',
  auth: browserlessAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/browserless.png',
  authors: ['LuizDMM'],
  actions: [
    captureScreenshot,
    generatePdf,
    scrapeUrl, // TODO
    runBqlQuery, // TODO
    getWebsitePerformance, // TODO
    createCustomApiCallAction({
      baseUrl: () => browserlessCommon.baseUrl,
      auth: browserlessAuth,
      authLocation: 'queryParams',
      authMapping: async (auth) => ({
        token: auth as string,
      }),
    }),
  ],
  triggers: [],
});
