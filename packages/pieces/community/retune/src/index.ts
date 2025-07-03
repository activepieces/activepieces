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

const markdownDescription = `
Follow these instructions to get your re:tune chat ID and API Key:

1. Visit the chatbots page: https://retune.so/chats
2. Once on the website, locate and click on the chatbot you want to use
3. From the URL, copy the chat ID you want to use;
e.g from this: https://retune.so/chat/acewocwe-123123-123123-123123/ your chat ID is "acewocwe-123123-123123-123123"
4. To get the API key, go to https://retune.so/settings
5. Scroll to the bottom to find "Re:tune API Keys" and copy your key below
`;

export const retuneAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    // There is no way to programmatically get the user's chatbots, so we have this
    chatId: Property.ShortText({
      displayName: 'Chat ID',
      description: 'The ID of the chat you want to use.',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your re:tune API key.',
      required: true,
    }),
  },

  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `https://retune.so/api/chat/${auth.auth.chatId}/threads`,
        method: HttpMethod.POST,
        headers: {
          'X-Workspace-API-Key': auth.auth.apiKey,
        },
        body: {},
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

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
        'X-Workspace-API-Key': (auth as { apiKey: string }).apiKey,
      }),
    }),
  ],
  triggers: [],
});
