import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { makeClient } from './common';

const authGuide = `
To obtain your WonderChat API credentials, follow these steps:

1. Log in to your WonderChat dashboard at https://app.wonderchat.io
2. Navigate to your chatbot settings
3. Find your API Key in the API section
4. Note your Chatbot ID from the chatbot settings
`;

export const wonderchatAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
      description: 'Your WonderChat API key',
    }),
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      required: true,
      description: 'The unique identifier for your chatbot',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(auth);
      const isValid = await client.validateAuth();
      return isValid ? { valid: true } : { valid: false, error: 'Invalid API credentials' };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API credentials',
      };
    }
  },
});
