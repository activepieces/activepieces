import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { askChatbot } from './lib/actions/ask-chatbot';
import { retuneAuth } from './lib/auth';

const RETUNE_API_URL = 'https://retune.so/api';

export const retune = createPiece({
  displayName: 're:tune',
  description:
    'Everything you need to transform your business with AI, from custom chatbots to autonomous agents.',

  auth: retuneAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/retune.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    askChatbot,
    createCustomApiCallAction({
      baseUrl: () => RETUNE_API_URL,
      auth: retuneAuth,
      authMapping: async (auth) => ({
        'X-Workspace-API-Key': (auth).props.apiKey,
      }),
      props: {
        url: {
          description: `Full URL, or a path relative to ${RETUNE_API_URL}`,
          placeholder: '/chat/your-chat-id/threads',
        },
      },
    }),
  ],
  triggers: [],
});
