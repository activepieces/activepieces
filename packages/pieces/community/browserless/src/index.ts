import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { browserlessAuth } from './lib/common/auth';
import { captureScreenshot } from './lib/actions/capture-screenshot';
import { generatePdf } from './lib/actions/generate-pdf';
import { scrapeUrl } from './lib/actions/scrape-url';
import { runBqlQuery } from './lib/actions/run-bql-query';
import { getWebsitePerformance } from './lib/actions/get-website-performance';

export const browserless = createPiece({
    displayName: 'Browserless',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/browserless.png',
    categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.MARKETING],
    authors: ['activepieces-community'],
    auth: browserlessAuth,
    actions: [
        captureScreenshot,
        generatePdf,
        scrapeUrl,
        runBqlQuery,
        getWebsitePerformance,
    ],
    triggers: [],
});