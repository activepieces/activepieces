import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { aiAnswerConfig } from './common/models';

export const aiAnswerAuth = PieceAuth.SecretText({
  displayName: 'AiAnswer API Access Token',
  required: true,
  description: `
      To obtain your AiAnswer API access token, follow these steps below:
      1. Log in to your AiAnswer account at https://app.aianswer.us .
      2. Navigate to Settings < API Key.
      3. Click on Copy icon to copy your existing Key or click on New API Key to create a new one.
      4. Copy the API Key and paste it below in "AiAnswer API Key".
    `,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<string[]>({
        method: HttpMethod.GET,
        url: `${aiAnswerConfig.baseUrl}/gmail/list_agents`,
        headers: {
          [aiAnswerConfig.accessTokenHeaderKey]: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
