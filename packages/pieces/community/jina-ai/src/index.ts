import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  extractWebpageContent,
  webSearchSummarization,
  deepSearchQuery,
  classifyContent,
  trainCustomClassifier
} from './lib/actions';

const markdownDescription = `
To use Jina AI, you need to get an API key:
1. Sign up for an account at https://jina.ai
2. Navigate to your account settings
3. Generate a new API key
4. Copy the API key and paste it below
`;

export const jinaAi = createPiece({
  displayName: 'Jina AI',
  description: 'AI-powered web content extraction, search, and classification',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    description: markdownDescription,
    required: true,
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/jina-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['denieler'],
  actions: [
    extractWebpageContent,
    webSearchSummarization,
    deepSearchQuery,
    classifyContent,
    trainCustomClassifier,
  ],
  triggers: [],
});