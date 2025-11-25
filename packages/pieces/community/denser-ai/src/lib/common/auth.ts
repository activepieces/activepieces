import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const denserAiAuth = PieceAuth.CustomAuth({
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description:
        'The Chatbot ID is available on the [main dashboard of Denser Chatbot](https://denser.ai/u/chatbots). Simply choose the ID of the chatbot you want',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API key',
      description: '',
      required: true,
    }),
  },
  required: true,
});
