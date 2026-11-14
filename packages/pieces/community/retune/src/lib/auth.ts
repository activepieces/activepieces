import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
To connect re:tune:
1. Open [your chatbots](https://retune.so/chats) and click the chatbot to use.
2. Copy the **Chat ID** from the page address: in \`https://retune.so/chat/abc-123/\` it is \`abc-123\`.
3. Go to [Settings](https://retune.so/settings), scroll to **re:tune API Keys** and copy your key.
`;

export const retuneAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    chatId: Property.ShortText({
      displayName: 'Chat ID',
      description: 'In the chatbot\'s address: retune.so/chat/<Chat ID>/',
      placeholder: 'acewocwe-123123-123123-123123',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Under re:tune API Keys in your re:tune settings.',
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
        error: 'Invalid API key or Chat ID.',
      };
    }
  },
});
