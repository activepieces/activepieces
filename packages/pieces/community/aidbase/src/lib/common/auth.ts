import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const aidbaseAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
    To get your API Key:
    1. Log in to your Aidbase dashboard.
    2. Navigate to **Settings** in the sidebar.
    3. Click on the **API** section.
    4. Generate and copy your new API Key.
    `,
  required: true,

  validate: async ({ auth }) => {
    const baseUrl = 'https://api.aidbase.ai/v1';

    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/knowledge`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check the key and try again.',
      };
    }
  },
});
