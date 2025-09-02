import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askQuestion, getHtml, getText, extractFields, getAccount } from './lib/actions';

export const webscrapingAiApi = createPiece({
  displayName: 'Webscraping-ai-api',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    description:
      'Your WebScraping.AI API key. You can find this in your WebScraping.AI dashboard.',
    required: true
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/webscraping-ai-api.png',
  authors: [],
  actions: [askQuestion, getHtml, getText, extractFields, getAccount],
  triggers: []
});
