import { createPiece } from '@activepieces/pieces-framework';
import { askAQuestionAboutTheWebPage } from './lib/actions/ask-a-question-about-the-web-page';
import { extractStructuredData } from './lib/actions/extract-structured-data';
import { getAccountInformation } from './lib/actions/get-account-information';
import { getPageHtml } from './lib/actions/get-page-html';
import { scrapeWebsiteText } from './lib/actions/scrape-website-text';
import { webscrapingAiAuth } from './lib/common';
import { PieceCategory } from '@activepieces/shared';

export const webscrapingAi = createPiece({
  displayName: 'WebScraping AI',
  auth: webscrapingAiAuth,
  minimumSupportedRelease: '0.36.1',
  description: 'WebScraping AI is a powerful tool that allows you to scrape websites and extract data.',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/webscraping-ai.png',
  authors: ['LuizDMM', 'onyedikachi-david'],
  actions: [
    askAQuestionAboutTheWebPage,
    getPageHtml,
    scrapeWebsiteText,
    extractStructuredData,
    getAccountInformation,
  ],
  triggers: [],
});
