import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { makeRequest } from './lib/common';
import { sendMessage } from './lib/actions/send-message';
import { createChatbot } from './lib/actions/create-chatbot';
import { newConversation } from './lib/triggers/new-conversation';
import { newContact } from './lib/triggers/new-contact';

const markdownDescription = `
To obtain your API key:

1. Go to your [Chatling account](https://app.chatling.ai)
2. Open **Project Settings**
3. Click the **API Keys** tab
4. Press **New API key** and generate a new key
5. Copy the key (it's only shown once)
`;

export const chatlingAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, HttpMethod.GET, '/project/settings');
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const chatling = createPiece({
  displayName: 'Chatling',
  description: 'Build AI chatbots trained on your data.',
  auth: chatlingAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chatling.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikachi-david'],
  actions: [
    sendMessage,
    createChatbot,
    createCustomApiCallAction({
      auth: chatlingAuth,
      baseUrl: () => 'https://api.chatling.ai/v2',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [newConversation, newContact],
});
