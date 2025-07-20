import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  extractWebpageContentAction,
  webSearchSummarizationAction,
  deepSearchQueryAction,
  classifyContentAction,
  trainCustomClassifierAction
} from './lib/actions';

const markdownDescription = `
You can get your API key from [Jina AI](https://jina.ai).
`;

export const jinaAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
})

export const jinaAi = createPiece({
  displayName: 'Jina AI',
  description: 'AI-powered web content extraction, search, and classification',
  auth: jinaAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/jinaai.jpeg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['denieler'],
  actions: [
    extractWebpageContentAction,
    webSearchSummarizationAction,
    deepSearchQueryAction,
    classifyContentAction,
    trainCustomClassifierAction,
  ],
  triggers: [],
});