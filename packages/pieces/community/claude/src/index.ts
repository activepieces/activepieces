import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import {
  AI_PROVIDERS_MAKRDOWN,
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import { askClaude } from './lib/actions/send-prompt';
import { baseUrl } from './lib/common/common';
import { PieceCategory } from '@activepieces/shared';

export const claudeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: AI_PROVIDERS_MAKRDOWN.anthropic,
});

export const claude = createPiece({
  displayName: 'Anthropic Claude',
  auth: claudeAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['dennisrongo'],
  actions: [
    askClaude,
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
