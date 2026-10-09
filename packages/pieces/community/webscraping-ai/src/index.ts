import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { askAQuestionAboutTheWebPageAction } from './lib/actions/ask-a-question-about-the-web-page';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data';
import { getAccountInformationAction } from './lib/actions/get-account-information';
import { getPageHtmlAction } from './lib/actions/get-page-html';
import { scrapeWebsiteTextAction } from './lib/actions/scrape-website-text';
import { webscrapingAiAuth } from './lib/auth';

export const webscrapingAi = createPiece({
  displayName: 'WebScraping AI',
  auth: webscrapingAiAuth,
  minimumSupportedRelease: '0.36.1',
  description: 'WebScraping AI is a powerful tool that allows you to scrape websites and extract data.',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/webscraping-ai.png',
  authors: ['LuizDMM', 'onyedikachi-david'],
  actions: [
    askAQuestionAboutTheWebPageAction,
    getPageHtmlAction,
    scrapeWebsiteTextAction,
    extractStructuredDataAction,
    getAccountInformationAction,
  ],
  triggers: [],
});
