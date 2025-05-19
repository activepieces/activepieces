import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getContentsAction } from './lib/actions/get-contents';
import { generateAnswerAction } from './lib/actions/generate-answer';
import { performSearchAction } from './lib/actions/perform-search';
import { findSimilarLinksAction } from './lib/actions/find-similar-links';

const markdownDescription = 'Get your API key from [Exa](https://exa.ai).';

export const exaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});

export const exa = createPiece({
  displayName: 'Exa',
  description: 'AI-powered search and content extraction from the web',
  auth: exaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/exa.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['your-name'],
  actions: [
    getContentsAction,
    generateAnswerAction,
    performSearchAction,
    findSimilarLinksAction,
  ],
  triggers: [],
});
