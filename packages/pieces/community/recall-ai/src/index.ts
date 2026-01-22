import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { recallAiAuth } from './lib/common/auth';
import { createBot } from './lib/actions/create-bot';
import { retrieveBot } from './lib/actions/retrieve-bot';
import { sendChatMessage } from './lib/actions/send-chat-message';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const recallAi = createPiece({
  displayName: 'Recall.ai',
  auth: recallAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/recall-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [
    createBot,
    retrieveBot,
    sendChatMessage,
    createCustomApiCallAction({
      auth: recallAiAuth,
      baseUrl: (auth) => {
        return `${(auth)?.props.server as string}/api/v1`;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `${auth.props.api_key}`,
        };
      },
    }),
  ],
  triggers: [],
});
