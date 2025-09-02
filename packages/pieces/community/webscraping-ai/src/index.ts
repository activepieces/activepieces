import { createPiece } from '@activepieces/pieces-framework';
import { askAQuestionAboutTheWebPage } from './lib/actions/ask-a-question-about-the-web-page';
import { extractStructuredData } from './lib/actions/extract-structured-data';
import { getAccountInformation } from './lib/actions/get-account-information';
import { getPageHtml } from './lib/actions/get-page-html';
import { scrapeWebsiteText } from './lib/actions/scrape-website-text';
import { webscrapingAiAuth } from './lib/common';

export const webscrapingAi = createPiece({
  displayName: 'WebScraping.ai',
  auth: webscrapingAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/webscraping-ai.png',
  authors: ['LuizDMM'],
  actions: [
    askAQuestionAboutTheWebPage,
    getPageHtml,
    scrapeWebsiteText,
    extractStructuredData,
    getAccountInformation,
  ],
  triggers: [],
});
