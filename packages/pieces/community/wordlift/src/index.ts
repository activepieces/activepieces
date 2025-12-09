import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askAgent } from './lib/actions/ask-agent';
import { queryKnowledgeGraph } from './lib/actions/query-knowledge-graph';
import { PieceCategory } from '@activepieces/shared';

export const wordliftAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Wordlift API Key',
});

export const wordlift = createPiece({
  displayName: 'Wordlift',
  auth: wordliftAuth,
  description:
    'WordLift is the AI-powered tool that revolutionizes your SEO. Get more organic traffic, reach a qualified audience and grow your business.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wordlift.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.MARKETING],
  actions: [askAgent, queryKnowledgeGraph],
  triggers: [],
});
