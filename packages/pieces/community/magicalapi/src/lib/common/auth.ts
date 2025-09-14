import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps to obtain your MagicalAPI API Key:

1. Visit [MagicalAPI](https://magicalapi.com) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the API settings section.
`;

export const magicalApiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.magicalapi.com/v1/profile',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
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
