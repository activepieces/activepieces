import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumClient } from './common/client';

export const figraniumAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Your Figranium server URL, e.g. http://localhost:11345',
      required: true,
      defaultValue: 'http://localhost:11345',
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Generate this from Figranium Settings > API Key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await figraniumClient({
        baseUrl: auth.baseUrl,
        apiKey: auth.apiKey,
        method: HttpMethod.GET,
        resourceUri: '/api/tasks/list',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Could not connect to Figranium. Check the base URL and API key.',
      };
    }
  },
});
