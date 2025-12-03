import { createPiece } from '@activepieces/pieces-framework';
import { chatnodeAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { askChatbotAction } from './lib/actions/ask-chatbot';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/constants';

export const chatnode = createPiece({
  displayName: 'ChatNode',
  auth: chatnodeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chatnode.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.PRODUCTIVITY,
  ],
  authors: ['kishanprmr'],
  actions: [
    askChatbotAction,
    createCustomApiCallAction({
      auth: chatnodeAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
