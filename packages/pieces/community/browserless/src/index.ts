import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { auditPagePerformance } from './lib/actions/ai/audit-page-performance';
import { createPdf } from './lib/actions/ai/create-pdf';
import { takeScreenshot } from './lib/actions/ai/take-screenshot';
import { cancelCrawl } from './lib/actions/cancel-crawl';
import { captureScreenshot } from './lib/actions/capture-screenshot';
import { generatePdf } from './lib/actions/generate-pdf';
import { getCrawl } from './lib/actions/get-crawl';
import { getPageContent } from './lib/actions/get-page-content';
import { getWebsitePerformance } from './lib/actions/get-website-performance';
import { listCrawls } from './lib/actions/list-crawls';
import { mapWebsite } from './lib/actions/map-website';
import { runBqlQuery } from './lib/actions/run-bql-query';
import { runFunction } from './lib/actions/run-function';
import { scrapeUrl } from './lib/actions/scrape-url';
import { searchWeb } from './lib/actions/search-web';
import { smartScrape } from './lib/actions/smart-scrape';
import { startCrawl } from './lib/actions/start-crawl';
import { unblockPage } from './lib/actions/unblock-page';
import { browserlessAuth } from './lib/common/auth';
import { browserlessApi } from './lib/common/client';

export const browserless = createPiece({
    displayName: 'Browserless',
    minimumSupportedRelease: '0.88.2',
    logoUrl: 'https://cdn.activepieces.com/pieces/browserless.png',
    categories: [PieceCategory.DEVELOPER_TOOLS],
    description: 'Browserless is a headless browser automation tool that allows you to scrape websites, take screenshots, and more.',
    authors: ['owuzo', 'onyedikachi-david'],
    auth: browserlessAuth,
    actions: [
        captureScreenshot,
        generatePdf,
        scrapeUrl,
        runBqlQuery,
        getWebsitePerformance,
        getPageContent,
        smartScrape,
        searchWeb,
        mapWebsite,
        startCrawl,
        getCrawl,
        listCrawls,
        cancelCrawl,
        unblockPage,
        runFunction,
        takeScreenshot,
        createPdf,
        auditPagePerformance,
        createCustomApiCallAction({
            auth: browserlessAuth,
            baseUrl: (auth) => (auth ? browserlessApi.resolveBaseUrl(auth.props) : ''),
            authLocation: 'queryParams',
            authMapping: async (auth, propsValue) => {
                const baseUrl = browserlessApi.resolveBaseUrl(auth.props);
                const url = readUrlProp(propsValue);
                if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
                    if (!browserlessApi.isSameTarget({ baseUrl, url })) {
                        throw new Error(`Custom API Call only sends your Browserless token to ${baseUrl}. Use a path such as /meta instead of another host.`);
                    }
                }
                return { token: auth.props.apiToken.trim() };
            },
        }),
    ],
    triggers: [],
});

function readUrlProp(propsValue: Record<string, unknown>): string {
    const holder = propsValue['url'];
    if (typeof holder === 'object' && holder !== null && 'url' in holder && typeof holder.url === 'string') {
        return holder.url.trim();
    }
    return '';
}
