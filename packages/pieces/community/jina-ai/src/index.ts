import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  extractWebpageContentAction,
  webSearchSummarizationAction,
  deepSearchQueryAction,
  classifyContentAction,
  trainCustomClassifierAction
} from './lib/actions';
import { jinaAiAuth } from './lib/auth';

const markdownDescription = `
You can get your API key from [Jina AI](https://jina.ai).
`;

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