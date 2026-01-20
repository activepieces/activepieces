import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { moveoTriggers } from './lib/triggers';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const moveoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Generate an API key in Deploy → Developer Tools → API Keys.',
  required: true,
});

export const moveoAi = createPiece({
  displayName: 'Moveo',
  description: 'Moveo.AI is a conversational AI platform that powers the toughest conversations through GenAI agents, driving efficiency and financial outcomes.',
  auth: moveoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/moveo-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikachi-david'],
  actions: [
    createCustomApiCallAction({
      auth: moveoAuth,
      baseUrl: () => 'https://api.moveo.ai/api/v1',
      authMapping: async (auth) => ({
        Authorization: `apikey ${auth.secret_text}`,
      }),
      props: {
        queryParams: {
          description: 'Most Moveo endpoints require account_slug as a query parameter.',
          defaultValue: {
            account_slug: '',
          },
        },
      },
    }),
  ],
  triggers: moveoTriggers,
});