import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askChatbot } from './lib/actions/ask-chatbot';
import { retuneAuth } from './lib/auth';

const markdownDescription = `
Follow these instructions to get your re:tune chat ID and API Key:

1. Visit the chatbots page: https://retune.so/chats
2. Once on the website, locate and click on the chatbot you want to use
3. From the URL, copy the chat ID you want to use;
e.g from this: https://retune.so/chat/acewocwe-123123-123123-123123/ your chat ID is "acewocwe-123123-123123-123123"
4. To get the API key, go to https://retune.so/settings
5. Scroll to the bottom to find "Re:tune API Keys" and copy your key below
`;

export const retune = createPiece({
  displayName: 're:tune',
  description:
    'Everything you need to transform your business with AI, from custom chatbots to autonomous agents.',

  auth: retuneAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/retune.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    askChatbot,
    createCustomApiCallAction({
      baseUrl: () => 'https://retune.so/api',
      auth: retuneAuth,
      authMapping: async (auth) => ({
        'X-Workspace-API-Key': (auth).props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
