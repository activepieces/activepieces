import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { capture_screenshot } from './lib/actions/capture-a-screenshot';
import { generate_pdf } from './lib/actions/generate-pdf';
import { scrapeUrl } from './lib/actions/scrape-url';
import { run_bql_query } from './lib/actions/run-bql-query';
import { get_website_performance } from './lib/actions/get-website-performance';
import { PieceCategory } from '@activepieces/shared';

export const browserlessAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Enter your Browserless API token from your dashboard',
  required: true
});

export const browserless = createPiece({
  displayName: 'Browserless',
  description: 'Cloud-based browser automation platform for screenshots, PDFs, scraping, and performance analysis',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/browserless.png',
  authors:['rk-1620'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: browserlessAuth,
  actions: [
    capture_screenshot,
    generate_pdf,
    scrapeUrl,
    run_bql_query,
    get_website_performance
  ],
  triggers: []
});
