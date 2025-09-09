import { PieceAuth} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
const baseUrl = 'https://api.runware.ai/v1';

export const runwareAuth = PieceAuth.SecretText({
  displayName: 'Runware API Key',
  description: 'Create or retrieve your API key from the Runware dashboard.',
  required: true,
  validate: async (auth) => {
    try {
      const authTask = [
        {
          taskType: "authentication",
          apiKey: auth.auth as string
        }
      ];
      
      await httpClient.sendRequest({
        url: `${baseUrl}`,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json'
        },
        body: authTask
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Runware API key.',
      };
    }
  },
});
