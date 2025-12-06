import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const pollybotAuth = PieceAuth.CustomAuth({
  description: 'Connect to your PollyBot instance',
  required: true,
  props: {
    apiKey: Property.LongText({
      displayName: 'PollyBot API Key',
      description:
        'Your API Key starting with `sk-workspace_...`. Find your API Key in your [PollyBot Dashboard Settings](https://pollybot.app/docs/authentication).',
      required: true,
    }),
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description:
        'The unique ID for the specific chatbot (e.g., `cmhm6o40a05h8mn12dv3tc456`). Learn more in the [PollyBot Authentication docs](https://pollybot.app/docs/authentication).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const baseUrl = 'https://pollybot.app/api/v1';
    const url = `${baseUrl}/chatbots/${auth.chatbotId}/leads`;

    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        headers: {
          Authorization: `Bearer ${auth.apiKey}`,
          'Content-Type': 'application/json',
        },
        queryParams: {
          limit: '1', // Minimal fetch for validation
        },
      });
      return { valid: true };
    } catch (e: unknown) {
      // Type assertion for the error object
      const error = e as {
        response?: { body?: { error?: string } };
        message?: string;
      };
      return {
        valid: false,
        error: `Authentication failed: ${
          error?.response?.body?.error || error.message || 'Unknown error'
        }`,
      };
    }
  },
});
