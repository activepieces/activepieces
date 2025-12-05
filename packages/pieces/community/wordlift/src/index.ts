import {
  createPiece,
  PieceAuth,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { askAgent } from './lib/actions/ask-agent';
import { queryKnowledgeGraph } from './lib/actions/query-knowledge-graph';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const wordliftAuth = PieceAuth.OAuth2({
  description: 'Wordlift API Key',
  authUrl: 'https://s.wordlift.io/oauth/authorize',
  tokenUrl: 'https://s.wordlift.io/oauth/token',
  scope: ['basic'],
  required: true,
});

export const wordlift = createPiece({
  displayName: 'Wordlift',
  auth: wordliftAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wordlift.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.MARKETING],
  actions: [
    askAgent,
    queryKnowledgeGraph,
    createCustomApiCallAction({
      auth: wordliftAuth,
      baseUrl: () => 'https://api.wordlift.io',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
