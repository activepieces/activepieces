import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askAgent } from './lib/actions/ask-agent';
import { queryKnowledgeGraph } from './lib/actions/query-knowledge-graph';
import { PieceCategory } from '@activepieces/shared';

export const wordliftAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Wordlift API Key',
  required: true,
});

export const wordlift = createPiece({
  displayName: 'Wordlift',
  auth: wordliftAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wordlift.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.MARKETING],
  actions: [askAgent, queryKnowledgeGraph],
  triggers: [],
});
