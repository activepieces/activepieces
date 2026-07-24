import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { askClaude } from './lib/actions/send-prompt';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data';
import { countTokensAction } from './lib/actions/count-tokens';
import { baseUrl } from './lib/common/common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { claudeAuth } from './lib/auth';

export const claude = createPiece({
  displayName: 'Anthropic Claude',
  auth: claudeAuth,
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['dennisrongo','kishanprmr', 'mahenoorsalat'],
  actions: [
    askClaude,
    extractStructuredDataAction,
    countTokensAction,
    createCustomApiCallAction({
      auth: claudeAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          'x-api-key': `${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
