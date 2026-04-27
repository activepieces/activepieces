import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps to obtain your LangSmith API Key:

1. Go to [LangSmith](https://smith.langchain.com/) and sign in.
2. Click on your profile icon (bottom-left) and select **Settings**.
3. Navigate to **API Keys** and click **Create API Key**.
4. Copy the key — it is only shown once.
`;

export const langsmithAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.smith.langchain.com/api/v1/sessions',
        headers: {
          'x-api-key': auth,
        },
        queryParams: {
          limit: '1',
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
});