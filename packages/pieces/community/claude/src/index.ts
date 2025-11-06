import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { askClaude } from './lib/actions/send-prompt';
import { baseUrl } from './lib/common/common';
import { PieceCategory } from '@activepieces/shared';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data';
import { SUPPORTED_AI_PROVIDERS } from '@activepieces/common-ai';

export const claudeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: SUPPORTED_AI_PROVIDERS.find(p => p.provider === 'anthropic')?.markdown,
});

export const claude = createPiece({
  displayName: 'Anthropic Claude',
  auth: claudeAuth,
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['dennisrongo','kishanprmr'],
  actions: [
    askClaude,
    extractStructuredDataAction,
    createCustomApiCallAction({
      auth: claudeAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          'x-api-key': `${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});
