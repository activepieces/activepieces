import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { askClaude } from './lib/actions/send-prompt';
import { baseUrl } from './lib/common/common';
import { PieceCategory } from '@activepieces/shared';

const markdownDescription = `
Follow these instructions to get your Claude API Key:

1. Visit the following website: https://console.anthropic.com/settings/keys.
2. Once on the website, locate and click on the option to obtain your Claude API Key.

`;

export const claudeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdownDescription,
});

export const claude = createPiece({
  displayName: 'Anthropic Claude',
  auth: claudeAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['dennisrongo'],
  actions: [
    askClaude,
    createCustomApiCallAction({
      auth: claudeAuth,
      baseUrl: () => baseUrl,
      authMapping: (auth) => {
        return {
          'x-api-key': `${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});
