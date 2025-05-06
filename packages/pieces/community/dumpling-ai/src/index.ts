import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { webSearch, searchNews, generateImage, scrapeWebsite, crawlWebsite, extractDocument } from './lib/actions';

export const dumplingAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});

export const dumplingAi = createPiece({
  displayName: 'dumpling-ai',
  auth: dumplingAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/dumpling-ai.png',
  authors: [],
  actions: [webSearch, searchNews, generateImage, scrapeWebsite, crawlWebsite, extractDocument],
  triggers: [],
});
