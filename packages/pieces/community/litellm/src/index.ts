import {
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askLitellm } from './lib/actions/ask-litellm';

export const litellmAuth = PieceAuth.SecretText({
  description: 'Enter your LiteLLM proxy API key (leave empty if proxy has no auth)',
  displayName: 'API Key',
  required: false,
});

export const litellm = createPiece({
  displayName: 'LiteLLM',
  description: 'Unified proxy for 100+ LLM providers with load balancing and spend tracking.',
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://raw.githubusercontent.com/BerriAI/litellm/main/litellm/proxy/swagger/favicon.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: litellmAuth,
  actions: [
    askLitellm,
    createCustomApiCallAction({
      auth: litellmAuth,
      baseUrl: () => process.env['LITELLM_BASE_URL'] ?? 'http://localhost:4000',
      authMapping: async (auth) => {
        if (auth.secret_text) {
          return { Authorization: `Bearer ${auth.secret_text}` };
        }
        return {};
      },
    }),
  ],
  authors: ['RheagalFire'],
  triggers: [],
});
