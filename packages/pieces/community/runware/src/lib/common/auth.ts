import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
To get your Runware API Key:

1. Sign up or log in on the [Runware website](https://my.runware.ai/).
2. Navigate to the **API Keys** page from the dashboard.
3. Click **"Create Key"**, give it a name, and copy the generated key.
`;

export const runwareAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    // The 'auth' prop here is the raw API key string
    try {
      await httpClient.sendRequest({
        url: 'https://api.runware.ai/v1',
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        // 👇 CHANGE IS HERE: Send a specific authentication task instead of an empty array.
        body: [
          {
            taskType: 'authentication',
            apiKey: auth,
          },
        ],
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});